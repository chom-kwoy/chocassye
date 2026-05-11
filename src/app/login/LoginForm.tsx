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

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      setError("Invalid email or password");
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
        <Typography variant="h4">Sign in</Typography>
      </Box>

      {registered && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Account created! You can now sign in.
        </Alert>
      )}

      {(error || urlError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ||
            (urlError === "OAuthAccountNotLinked"
              ? "This email is registered with a different sign-in method."
              : "An error occurred. Please try again.")}
        </Alert>
      )}

      <Stack spacing={2} component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Password"
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
          label="Keep me signed in"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          size="large"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </Stack>

      <Divider sx={{ my: 3 }}>or</Divider>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        startIcon={<GoogleIcon />}
        onClick={() => signIn("google", { callbackUrl })}
      >
        Sign in with Google
      </Button>

      <Typography sx={{ mt: 3, textAlign: "center" }} variant="body2">
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ fontWeight: 600 }}>
          Register
        </Link>
      </Typography>
    </Box>
  );
}
