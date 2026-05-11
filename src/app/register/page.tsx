"use client";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import { useTranslation } from "@/components/TranslationProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t("Passwords do not match"));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || t("Registration failed"));
      setLoading(false);
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 4, px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <PersonAddIcon />
        <Typography variant="h4">{t("Create account")}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label={t("Name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoComplete="name"
        />
        <TextField
          label={t("Email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label={t("Password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          helperText={t("At least 8 characters")}
          autoComplete="new-password"
        />
        <TextField
          label={t("Confirm password")}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          fullWidth
          autoComplete="new-password"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
        >
          {loading ? t("Creating account…") : t("Create account")}
        </Button>
      </Stack>

      <Typography sx={{ mt: 3, textAlign: "center" }} variant="body2">
        {t("Already have an account?")}{" "}
        <Link href="/login" style={{ fontWeight: 600 }}>
          {t("Sign in")}
        </Link>
      </Typography>
    </Box>
  );
}
