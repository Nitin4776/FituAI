'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, MessageSquare, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signUpAction, signInWithGoogle, sendOtp, signUpWithPhoneNumber, initializeRecaptchaVerifier } from '../auth/actions';
import { Logo } from '@/components/icons/logo';
import type { ConfirmationResult } from 'firebase/auth';


const emailSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const phoneSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    phone: z.string().min(10, 'Please enter a valid phone number with country code.'),
    otp: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type PhoneFormValues = z.infer<typeof phoneSchema>;

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.533,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);


export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    initializeRecaptchaVerifier();
  }, []);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { name: '', phone: '' },
  });

  const onEmailSubmit: SubmitHandler<EmailFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await signUpAction(data);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
        await signInWithGoogle();
    } catch(error) {
         toast({
            variant: 'destructive',
            title: 'Google Sign-Up Failed',
            description: (error as Error).message,
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleSendOtp = async () => {
    const phone = phoneForm.getValues('phone');
    if (!phone || phone.length < 10) {
        phoneForm.setError('phone', { type: 'manual', message: 'Please enter a valid phone number.' });
        return;
    }
    setIsLoading(true);
    try {
        const result = await sendOtp(phone);
        setConfirmationResult(result);
        setIsOtpSent(true);
        toast({ title: 'OTP Sent', description: 'Check your phone for the verification code.' });
    } catch(error) {
         toast({
            variant: 'destructive',
            title: 'Failed to Send OTP',
            description: (error as Error).message,
        });
    } finally {
        setIsLoading(false);
    }
  }

  const onPhoneSubmit: SubmitHandler<PhoneFormValues> = async (data) => {
    if (!data.otp) {
        phoneForm.setError('otp', { type: 'manual', message: 'Please enter the OTP.' });
        return;
    }
    if (!confirmationResult) {
         toast({ variant: 'destructive', title: 'Error', description: 'Please request an OTP first.' });
        return;
    }
    setIsLoading(true);
    try {
      await signUpWithPhoneNumber(data.name, confirmationResult, data.otp);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       <div id="recaptcha-container"></div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className='flex justify-center mb-4'>
                <Logo />
            </div>
          <CardTitle className="font-headline">Create an Account</CardTitle>
          <CardDescription>Join to start your personalized fitness plan.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="mobile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mobile"><MessageSquare className="mr-2" /> Mobile</TabsTrigger>
                    <TabsTrigger value="email"><Mail className="mr-2" /> Email</TabsTrigger>
                </TabsList>
                <TabsContent value="mobile">
                    <Form {...phoneForm}>
                        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={phoneForm.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={phoneForm.control}
                                name="phone"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <div className='flex gap-2'>
                                            <Input type="tel" placeholder="+91 1234567890" {...field} disabled={isOtpSent} />
                                            <Button type="button" onClick={handleSendOtp} disabled={isLoading || isOtpSent}>
                                                {isLoading ? <Loader2 className="animate-spin" /> : isOtpSent ? 'Sent' : 'Send OTP'}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {isOtpSent && (
                                 <FormField
                                    control={phoneForm.control}
                                    name="otp"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>One-Time Password</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="123456" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}
                             <Button type="submit" disabled={isLoading || !isOtpSent} className="w-full">
                                {isLoading ? ( <Loader2 className="animate-spin" /> ) : ( <> <UserPlus className="mr-2" /> Sign Up with OTP </> )}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="email">
                     <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={emailForm.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={emailForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={emailForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? (
                            <Loader2 className="animate-spin" />
                            ) : (
                            <>
                                <UserPlus className="mr-2" /> Sign Up
                            </>
                            )}
                        </Button>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full">
                 {isLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Google</>}
            </Button>
          
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
