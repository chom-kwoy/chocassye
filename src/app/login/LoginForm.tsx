"use client";

import GoogleIcon from "@mui/icons-material/Google";
import LoginIcon from "@mui/icons-material/Login";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { useTranslation } from "@/components/TranslationProvider";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/search";
  const urlError = searchParams.get("error");
  const registered = searchParams.get("registered");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      remember: String(remember),
      redirect: false,
    });

    if (result?.error) {
      setError(t("Invalid email or password"));
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 4, px: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <LoginIcon />
        <Typography variant="h4">{t("Sign in")}</Typography>
      </Box>

      {registered && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t("Account created! You can now sign in.")}
        </Alert>
      )}

      {(error || urlError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ||
            (urlError === "OAuthAccountNotLinked"
              ? t("This email is registered with a different sign-in method.")
              : t("An error occurred. Please try again."))}
        </Alert>
      )}

      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
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
          autoComplete="current-password"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
          }
          label={t("Keep me signed in")}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          size="large"
        >
          {loading ? t("Signing in…") : t("Sign in")}
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }}>{t("or")}</Divider>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        startIcon={<GoogleIcon />}
        onClick={() => signIn("google", { callbackUrl })}
      >
        {t("Sign in with Google")}
      </Button>

      <Typography sx={{ mt: 3, textAlign: "center" }} variant="body2">
        {t("Don't have an account?")}{" "}
        <Link href="/register" style={{ fontWeight: 600 }}>
          {t("Register")}
        </Link>
      </Typography>
    </Box>
  );
}
