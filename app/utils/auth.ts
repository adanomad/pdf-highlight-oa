// app/utils/auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { googleClientId, googleClientSecret } from "./env";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
});
