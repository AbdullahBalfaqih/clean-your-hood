"use client"

 import { SupportForm } from "./support-form"

export const revalidate = 0;

export default function SupportPage() {
  return (
       <div className="w-full max-w-5xl mx-auto">
        <SupportForm />
      </div>
   )
}
