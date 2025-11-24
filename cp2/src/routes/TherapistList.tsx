import { Link } from "react-router-dom";

const therapists = [
  { id: "t1", name: "Dr. Alice Tan" },
  { id: "t2", name: "Dr. Bryan Lee" },
  { id: "t3", name: "Dr. Chloe Wong" },
];

export default function TherapistList() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Choose a Therapist</h2>

      <div className="space-y-4">
        {therapists.map(t => (
          <Link
            key={t.id}
            to={`/book-session/${t.id}`}
            className="block p-4 bg-white rounded-lg shadow hover:bg-gray-100 transition"
          >
            <p className="font-semibold">{t.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
