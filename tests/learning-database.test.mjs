import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("private learning permissions, grading, reviews and atomic booking", async () => {
  const db = new PGlite();
  const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const student = id(1),
    teacher = id(2),
    outsider = id(3),
    admin = id(4),
    tutor = id(5),
    booking = id(6);
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('test.user_id',true),'')::uuid$$; GRANT USAGE ON SCHEMA auth TO anon,authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
 CREATE TYPE public.booking_status AS ENUM('pending','confirmed','completed','cancelled'); CREATE TYPE public.booking_format AS ENUM('home','online','office');
 CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT $1='${admin}'::uuid AND $2='admin'$$;
 CREATE TABLE public.tutors(id uuid PRIMARY KEY,user_id uuid,is_active boolean,hourly_rate_fcfa integer);
 CREATE TABLE public.bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),student_id uuid,tutor_id uuid REFERENCES tutors(id),subject text,level text,format booking_format,starts_at timestamptz,ends_at timestamptz,address text,notes text,price_fcfa integer,status booking_status,payment_id uuid,updated_at timestamptz DEFAULT now());
 CREATE TABLE public.payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,booking_id uuid,provider text,phone text,transaction_ref text UNIQUE,amount_xaf integer,status text,plan_id uuid,notes text,verified_at timestamptz,verified_by uuid);
 CREATE TABLE public.tutor_availability(tutor_id uuid,weekday integer,start_time time,end_time time);
 GRANT SELECT ON tutors TO anon,authenticated; GRANT SELECT,INSERT,UPDATE ON bookings TO authenticated;
 ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
 CREATE POLICY participants ON bookings FOR SELECT TO authenticated USING(student_id=auth.uid() OR EXISTS(SELECT 1 FROM tutors WHERE tutors.id=tutor_id AND user_id=auth.uid()) OR has_role(auth.uid(),'admin'));
 CREATE POLICY own_insert ON bookings FOR INSERT TO authenticated WITH CHECK(student_id=auth.uid());
 CREATE POLICY own_update ON bookings FOR UPDATE TO authenticated USING(student_id=auth.uid() OR EXISTS(SELECT 1 FROM tutors WHERE tutors.id=tutor_id AND user_id=auth.uid()));
 INSERT INTO auth.users VALUES('${student}'),('${teacher}'),('${outsider}'),('${admin}'); INSERT INTO tutors VALUES('${tutor}','${teacher}',true,3000);
 INSERT INTO bookings(id,student_id,tutor_id,subject,level,format,starts_at,ends_at,price_fcfa,status) VALUES('${booking}','${student}','${tutor}','Maths','Terminale','online',now()-interval '2 hours',now()-interval '1 hour',3000,'confirmed');
 INSERT INTO tutor_availability SELECT '${tutor}',generate_series(0,6),'00:00','23:59';`);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/20261017080000_learning_workspace.sql", import.meta.url),
        "utf8",
      ),
    );
    const as = async (user) => {
      await db.exec("RESET ROLE");
      await db.query("SELECT set_config('test.user_id',$1,false)", [user]);
      await db.exec("SET ROLE authenticated");
    };
    await as(student);
    await assert.rejects(db.query("UPDATE bookings SET status='completed' WHERE id=$1", [booking]));
    await assert.rejects(
      db.query(
        "SELECT save_lesson_report($1,'Objective','A sufficiently detailed lesson summary','Homework',80)",
        [booking],
      ),
    );
    await as(teacher);
    await db.query(
      "SELECT save_lesson_report($1,'Objective','A sufficiently detailed lesson summary','Homework',80)",
      [booking],
    );
    const questions = [
      {
        prompt: "What is 2 + 2?",
        choices: ["3", "4"],
        correct: 1,
        explanation: "Two pairs total four.",
      },
    ];
    const quiz = (
      await db.query(
        "INSERT INTO lesson_quizzes(booking_id,author_id,title,questions) VALUES($1,$2,$3,$4) RETURNING id",
        [booking, teacher, "Addition", JSON.stringify(questions)],
      )
    ).rows[0].id;
    await assert.rejects(
      db.query(
        "INSERT INTO lesson_quizzes(booking_id,author_id,title,questions) VALUES($1,$2,$3,$4)",
        [
          booking,
          teacher,
          "Broken",
          JSON.stringify([{ prompt: "Bad", choices: ["a", "b"], correct: 9, explanation: "" }]),
        ],
      ),
    );
    await as(student);
    assert.equal((await db.query("SELECT * FROM lesson_quizzes")).rows.length, 0);
    const safe = (await db.query("SELECT get_lesson_quiz($1) AS quiz", [booking])).rows[0].quiz;
    assert.equal("correct" in safe.questions[0], false);
    const result = (await db.query("SELECT submit_lesson_quiz($1,$2) AS result", [quiz, "[1]"]))
      .rows[0].result;
    assert.equal(result.score, 1);
    await assert.rejects(db.query("SELECT submit_lesson_quiz($1,$2)", [quiz, "[1]"]));
    await assert.rejects(
      db.query(
        "INSERT INTO lesson_events(booking_id,actor_id,kind,payload) VALUES($1,$2,'clear','{}')",
        [booking, student],
      ),
    );
    await db.query(
      "INSERT INTO lesson_events(booking_id,actor_id,kind,payload) VALUES($1,$2,'message',$3)",
      [booking, student, JSON.stringify({ text: "Thank you" })],
    );
    await assert.rejects(
      db.query(
        "INSERT INTO lesson_events(booking_id,actor_id,kind,payload) VALUES($1,$2,'stroke',$3)",
        [booking, student, JSON.stringify({ color: "#14213d", width: 2, points: [[2, 0]] })],
      ),
    );
    await db.query(
      "INSERT INTO tutor_reviews(booking_id,tutor_id,rating,comment,display_name) VALUES($1,$2,5,$3,$4)",
      [booking, tutor, "A helpful completed lesson.", "M."],
    );
    await assert.rejects(
      db.query(
        "INSERT INTO tutor_reviews(booking_id,tutor_id,rating,comment,display_name) VALUES($1,$2,5,$3,$4)",
        [booking, tutor, "A duplicate review.", "M."],
      ),
    );
    await as(outsider);
    assert.equal((await db.query("SELECT * FROM lesson_reports")).rows.length, 0);
    assert.equal((await db.query("SELECT * FROM lesson_events")).rows.length, 0);
    await assert.rejects(db.query("SELECT get_lesson_quiz($1)", [booking]));
    await assert.rejects(db.query("SELECT submit_lesson_quiz($1,$2)", [quiz, "[1]"]));
    await db.exec("RESET ROLE; SET ROLE anon");
    assert.equal((await db.query("SELECT rating,comment FROM tutor_reviews")).rows.length, 1);
    await assert.rejects(db.query("SELECT booking_id FROM tutor_reviews"));
    await as(student);
    const starts = new Date();
    starts.setUTCDate(starts.getUTCDate() + 2);
    starts.setUTCHours(12, 0, 0, 0);
    const args = [
      tutor,
      "Maths",
      "Terminale",
      "online",
      starts.toISOString(),
      60,
      "",
      "",
      "orange",
      "699123456",
      "TEST-REFERENCE",
    ];
    const request = "SELECT request_lesson_booking($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) AS booking";
    const reserved = (await db.query(request, args)).rows[0].booking;
    assert.equal(reserved.price_fcfa, 3000);
    assert.equal((await db.query(request, args)).rows[0].booking.id, reserved.id);
    await assert.rejects(db.query(request, [...args.slice(0, 10), "OTHER-REFERENCE"]));
    await db.exec("RESET ROLE");
    const payment = (await db.query("SELECT id FROM payments WHERE booking_id=$1", [reserved.id]))
      .rows[0].id;
    await as(outsider);
    await assert.rejects(
      db.query("SELECT review_lesson_payment($1,true,$2)", [payment, "checked"]),
    );
    await as(admin);
    await db.query("SELECT review_lesson_payment($1,true,$2)", [payment, "Receipt checked"]);
    await as(student);
    assert.equal(
      (await db.query("SELECT status FROM bookings WHERE id=$1", [reserved.id])).rows[0].status,
      "confirmed",
    );
    await as(teacher);
    await assert.rejects(
      db.query(
        "SELECT save_lesson_report($1,'Objective','A sufficiently detailed lesson summary','Homework',80)",
        [reserved.id],
      ),
    );
  } finally {
    await db.close();
  }
});
