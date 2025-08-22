import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/crickseries.firebasestorage.app/o/ChatGPT%20Image%20Aug%2022%2C%202025%2C%2004_53_05%20PM.png?alt=media&token=f683841c-65cc-4887-8590-72f080da56f3"
      alt="App Logo"
      width={40}
      height={40}
      className="rounded-md"
      data-ai-hint="logo"
    />
  );
}
