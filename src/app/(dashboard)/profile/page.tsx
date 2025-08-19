import { ProfileManager } from '@/components/profile-manager';

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Profile & Goal</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Update your personal details and set your goal to get personalized recommendations.
        </p>
      </div>
      <ProfileManager />
    </div>
  );
}
