import UsersList from "@/components/users-list";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <UsersList />
    </div>
  );
}
