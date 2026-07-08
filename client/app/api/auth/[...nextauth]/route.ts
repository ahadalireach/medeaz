import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      return true;
    },
    async jwt({ token, account, user, trigger, session }) {
      if (account?.provider === "google" && account.id_token) {
        token.idToken = account.id_token;
        token.provider = "google";
      }
      if (trigger === "update" && session?.user) {
        token.role = session.user.role;
        token.isOnboardingComplete = session.user.isOnboardingComplete;
        token.onboardingStep = session.user.onboardingStep;
        token.userId = session.user._id;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).idToken = token.idToken;
      (session as any).provider = token.provider;
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).isOnboardingComplete = token.isOnboardingComplete;
        (session.user as any).onboardingStep = token.onboardingStep;
        (session.user as any)._id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
