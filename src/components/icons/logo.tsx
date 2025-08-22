import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="https://placehold.co/50x50.png"
      alt="App Logo"
      width={40}
      height={40}
      className="rounded-md"
      data-ai-hint="logo"
    />
  );
}
