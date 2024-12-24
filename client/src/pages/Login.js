import { LoginForm } from "../components/login-form"

import DarkModeToggle from '../components/DarkModeToggle'




export default function Page() {
  return (
    (<div className="flex dark:bg-gray-950 min-h-svh w-full items-center justify-center p-6 md:p-10">

      <div className="w-full max-w-sm">
        <LoginForm />

    <DarkModeToggle/>
      </div>
    </div>)
  );
}
