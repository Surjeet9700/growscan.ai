// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-8">
      <SignUp
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
