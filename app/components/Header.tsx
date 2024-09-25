// app/components/Header.tsx
import Link from "next/link";
import { useSession } from "next-auth/react";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = ({}: HeaderProps) => {
  // const session = useSession();
  return (
    <div className="w-full bg-white shadow-md p-4 flex items-center justify-center md:flow-root">
      <div className="float-left h-full">
        <h1 className="text-2xl font-bold underline underline-offset-8">
          Adanomad Challenge
        </h1>
      </div>
      {/*<div className="float-right space-x-2">
        <div className="px-4 py-1.5 inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 text-white hover:bg-blue-600">
           <Link
            href={`/api/auth/${session.status === "authenticated" ? "signout" : "signin"}`}
          >
            {`${session.status === "authenticated" ? "Sign out" : "Sign in with Google"}`}
          </Link> 
        </div>
      </div>*/}
    </div>
  );
};

export { Header };
