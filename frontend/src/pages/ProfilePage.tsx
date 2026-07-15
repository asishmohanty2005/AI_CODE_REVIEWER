import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage, usersApi } from "@/services/api";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: user?.full_name || "",
      bio: user?.bio || "",
      avatar_url: user?.avatar_url || "",
    },
  });

  const onSubmit = async (data: {
    full_name: string;
    bio: string;
    avatar_url: string;
  }) => {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        full_name: data.full_name || undefined,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || undefined,
      });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-white sm:text-3xl">Profile</h1>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-card/60 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-2xl font-bold text-white">
          {(user.full_name || user.username).charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            {user.full_name || user.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            @{user.username} · {user.email}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge>{user.plan} plan</Badge>
            <Badge variant="secondary">Joined {formatDate(user.created_at)}</Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Update how you appear across CodeLens.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input {...register("full_name")} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input {...register("avatar_url")} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea {...register("bio")} placeholder="Short bio..." rows={4} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
