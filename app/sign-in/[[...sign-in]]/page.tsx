// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8">
      <SignIn
        forceRedirectUrl="/scan"
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "shadow-none border border-border rounded-2xl",
            headerTitle: "text-stone-800",
            socialButtonsBlockButton: "rounded-full border-border hover:bg-stone-50",
            formButtonPrimary: "bg-primary hover:bg-primary/90 rounded-full",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
      />
    </div>
  );
}
