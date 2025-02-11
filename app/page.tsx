import Link from "next/link"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ManufacturingModuleLanding() {
  const features = [
    "Track products and inventory",
    "Manage raw materials of different sizes",
    "Create and manage purchase orders",
    "Define and use different units of measurement",
    "Manage product colors and variations",
    "Generate production reports",
    "Monitor production efficiency",
    "Manage quality control processes",
    "Track equipment maintenance",
    "Manage supplier information",
  ]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4 md:p-8">
      <div className="container max-w-4xl">
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Manufacturing Module
          </h1>
          <p className="text-xl text-gray-600">Streamline your manufacturing process with our comprehensive module</p>
        </section>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-orange-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild className="bg-orange-500 px-8 py-6 text-lg font-semibold text-white hover:bg-orange-600">
            <Link href="/units">Get Started</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

