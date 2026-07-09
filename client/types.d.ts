/// <reference types="next" />
/// <reference types="next/image-types/global" />

// CSS Module declarations
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

// Custom web component declarations (ElevenLabs Conversational AI widget)
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id'?: string;
      };
    }
  }
}

// NextAuth session type augmentation
declare module "next-auth" {
  interface Session {
    idToken?: string;
    provider?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      _id?: string;
      isOnboardingComplete?: boolean;
      onboardingStep?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
    provider?: string;
    role?: string;
    userId?: string;
    isOnboardingComplete?: boolean;
    onboardingStep?: number;
  }
}
