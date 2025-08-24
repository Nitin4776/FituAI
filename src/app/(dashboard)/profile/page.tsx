
'use client';

import { ProfileForm } from '@/components/profile-form';

export default function ProfilePage() {
  
  return (
    <div className="space-y-8">
        <div>
            <h1 className="font-headline text-3xl md:text-4xl text-primary">Profile</h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Update your personal details to calculate your body metrics.
            </p>
        </div>
      <ProfileForm />
    </div>
  );
}
