import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default async function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8">
      <Card className="max-w-4xl w-full">
        <CardHeader className="pb-2">
          <CardTitle>Welcome, camper!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 pt-0">
          <div className="relative w-full h-96 rounded-md overflow-hidden flex justify-center items-center">
            <Image
              src="/images/brokie.png"
              alt="Unhappy camper"
              className="object-contain"
              priority
              width={420}
              height={562}
            />
          </div>
          <p>
            We connect unhappy campers with law firms looking to organize class
            action lawsuits.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
