export default async function SecurePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Secure Page</h1>
      <p className="mb-4">
        This content is only visible to authenticated users.
      </p>
      <div className="p-4 bg-green-100 border border-green-300 rounded-md">
        <p className="text-green-800">
          You are successfully authenticated! Your session is valid.
        </p>
      </div>
    </div>
  );
}
