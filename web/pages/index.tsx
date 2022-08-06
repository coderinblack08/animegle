import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-bold">Animegle</h1>
      <p className="text-gray-500 mb-6 mt-1">
        Omegle but with your face is replaced with an anime girl/boy.
      </p>
      <button>Match me</button>
    </div>
  );
};

export default Home;
