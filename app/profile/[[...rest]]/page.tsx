"use client";

import { UserProfile } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function ProfilePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-full pb-4"
    >
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-0 bg-transparent",
            navbar: "hidden",
            pageScrollBox: "p-0",
          },
        }}
      />
    </motion.div>
  );
}
