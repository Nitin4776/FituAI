
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  TestTube2,
  Replace,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

const aiFeatures = [
    {
        href: '/healthy-swaps',
        title: 'Healthy Swaps',
        description: 'Get AI-powered food swap suggestions.',
        icon: Replace,
    },
    {
        href: '/blood-test',
        title: 'Blood Test Analysis',
        description: 'Upload your report for an AI analysis.',
        icon: TestTube2,
    }
]

export default function AIPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary flex items-center gap-2">
            AI Health Tools <Sparkles className="text-yellow-500" />
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore powerful, AI-driven features to gain deeper insights into your health.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {aiFeatures.map((feature) => (
             <Link href={feature.href} key={feature.href} className="group">
                <Card className="hover:shadow-xl transition-shadow h-full hover:border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-4">
                            <feature.icon className="h-8 w-8 text-primary" />
                            <span>{feature.title}</span>
                        </CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-center justify-end text-sm font-medium text-primary group-hover:underline">
                            Go to {feature.title} <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        ))}
      </div>
    </div>
  );
}
