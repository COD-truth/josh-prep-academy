import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";
export function PhotoUpload({
  lang,
  value,
  onChange,
}: {
  lang: Lang;
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  return (
    <div>
      <label className="block text-sm font-semibold">
        {tr("Photo du profil (facultative)", "Profile photo (optional)")}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          className="mt-2 block w-full text-sm"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setError("");
            if (
              !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
              file.size > 5 * 1024 * 1024
            ) {
              setError(tr("JPG, PNG ou WebP, 5 Mo maximum.", "JPG, PNG or WebP, up to 5 MB."));
              event.target.value = "";
              return;
            }
            setBusy(true);
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user)
                throw new Error(
                  tr("Connectez-vous pour ajouter une photo.", "Sign in to upload a photo."),
                );
              const ext =
                file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
              const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
              const { error } = await supabase.storage
                .from("tutor-photos")
                .upload(path, file, { contentType: file.type, upsert: false });
              if (error) throw error;
              onChange(supabase.storage.from("tutor-photos").getPublicUrl(path).data.publicUrl);
            } catch (error) {
              setError(
                error instanceof Error ? error.message : tr("Envoi impossible.", "Upload failed."),
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">
        {tr(
          "Utilisez une photo que vous êtes autorisé à publier. Cette image sera accessible publiquement.",
          "Use a photo you have permission to publish. This image will be publicly accessible.",
        )}
      </p>
      {busy && <p role="status">{tr("Envoi…", "Uploading…")}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive mt-2">
          {error}
        </p>
      )}
      {value && (
        <img
          src={value}
          alt={tr("Aperçu du profil", "Profile preview")}
          className="mt-3 size-24 rounded-2xl object-cover"
        />
      )}
    </div>
  );
}
