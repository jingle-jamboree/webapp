import { useNavigate } from 'react-router-dom';

const features = [
  { id: 1, name: "Lost & Found", icon: "🔍", path: "/lost-and-found" },
  { id: 2, name: "Pick My Parcel", icon: "📦", path: "/parcel" },
  { id: 3, name: "Cat Spotter", icon: "🐈", path: "/cats" },
  { id: 4, name: "Pay For Project", icon: "📝", path: "/pay" }
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          Welcome to JIIT Tools
        </h1>

        <div className="p-6 bg-dark-card/50 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <button
                key={feature.id}
                className="h-32 space-y-2 flex flex-col items-center justify-center text-lg transition-all rounded-lg
                  bg-dark-card border-2 border-gray-700 hover:border-blue-500 text-gray-200"
                onClick={() => navigate(feature.path)}
              >
                <span className="text-2xl">{feature.icon}</span>
                <span>{feature.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}