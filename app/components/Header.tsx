// app/components/Header.tsx
import Link from "next/link";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = ({}: HeaderProps) => {
  return (
    <div className="w-full bg-white shadow-md p-4 flex items-center justify-center md:flow-root">
      <div className="float-left h-full">
        <h1 className="text-2xl font-bold underline underline-offset-8">
          PDF Vector Search
        </h1>
      </div>
    </div>
  );
};

export { Header };
