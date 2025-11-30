import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8">
      <Card className="max-w-4xl w-full">
        <CardHeader className="pb-2">
          <CardTitle>Welcome, camper!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 pt-0">
          <p>
            We connect unhappy campers with law firms looking to organize class
            action lawsuits.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
