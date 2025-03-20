import { twMerge } from "tailwind-merge";

const Loader = ({ fullscreen: fullscreen = false }) => {
  return (
    <div
      className={twMerge("flex items-center justify-center", {
        "fixed top-0 left-0 w-screen h-screen": fullscreen,
      })}
    >
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
};

export default Loader;
