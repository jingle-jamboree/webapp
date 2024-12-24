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
        <div className="container mx-auto px-4 py-8 sm:py-16">
            <h1 className="text-5xl font-bold text-center mb-4 gradient-text">
                JIIT Tools
            </h1>
            <p className="text-center text-gray-400 mb-12 text-lg">
                Your digital companion for campus life
            </p>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    {features.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => navigate(feature.path)}
                            className="feature-card group aspect-[4/3] sm:aspect-square"
                        >
                            <div className="feature-glow" />
                            <div className="feature-inner">
                                <span className="feature-icon">
                                    {feature.icon}
                                </span>
                                <span className="feature-name">
                                    {feature.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}