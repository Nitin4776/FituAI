
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller, type UseFormReturn } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Mail, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { signInAction, signInWithGoogle, sendOtp, signInWithPhoneNumber, initializeRecaptchaVerifier } from '../auth/actions';
import { Logo } from '@/components/icons/logo';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'
import { cn } from '@/lib/utils';


const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const phoneSchema = z.object({
    phoneNumber: z.string().min(10, 'Please enter a valid phone number.'),
});
type PhoneFormValues = z.infer<typeof phoneSchema>;

const otpSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits.'),
});
type OtpFormValues = z.infer<typeof otpSchema>;

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.533,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);


const PhoneSignInForm = ({ form, onSubmit, isLoading }: { form: UseFormReturn<PhoneFormValues>, onSubmit: SubmitHandler<PhoneFormValues>, isLoading: boolean }) => (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Controller
                name="phoneNumber"
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                             <PhoneInput
                                country={'in'}
                                value={field.value}
                                onChange={field.onChange}
                                inputClass={cn(
                                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm !pl-12 !w-full"
                                )}
                                buttonClass="rounded-l-md"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <> Continue </>}
            </Button>
        </form>
    </Form>
  );

  const OtpVerificationForm = ({ form, onSubmit, isLoading, phoneNumber, onBack }: { form: UseFormReturn<OtpFormValues>, onSubmit: SubmitHandler<OtpFormValues>, isLoading: boolean, phoneNumber: string, onBack: () => void }) => (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="text-center">
                <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to:</p>
                <p className="font-semibold">{phoneNumber}</p>
            </div>
            <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder="_ _ _ _ _ _" 
                            {...field}
                            className="text-center tracking-[0.5em]"
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <> Verify & Sign In</> }
            </Button>
            <Button variant="link" size="sm" onClick={onBack} className="w-full">
                Back to sign in
            </Button>
        </form>
    </Form>
  );

  const EmailSignInForm = ({ form, onSubmit, isLoading }: { form: UseFormReturn<EmailFormValues>, onSubmit: SubmitHandler<EmailFormValues>, isLoading: boolean }) => (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
            control={form.control}
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
            control={form.control}
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
        <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? ( <Loader2 className="animate-spin" /> ) : ( <> <LogIn className="mr-2" /> Sign In </> )}
        </Button>
        </form>
    </Form>
  );


export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [signinMethod, setSigninMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: '' },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' }
  });
  
  const onEmailSubmit: SubmitHandler<EmailFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await signInAction(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPhoneSubmit: SubmitHandler<PhoneFormValues> = async (data) => {
    setIsLoading(true);
    setPhoneNumber(data.phoneNumber);
    try {
        const sendOtpWithRecaptcha = () => {
            sendOtp(data.phoneNumber)
                .then(() => {
                    setStep('otp');
                    toast({
                        title: 'OTP Sent',
                        description: 'Please check your phone for the verification code.',
                    });
                })
                .catch((error) => {
                     toast({
                        variant: 'destructive',
                        title: 'Failed to Send OTP',
                        description: (error as Error).message,
                    });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        };
        initializeRecaptchaVerifier(sendOtpWithRecaptcha);
        window.recaptchaVerifier.render();

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Failed to Send OTP',
            description: (error as Error).message,
        });
        setIsLoading(false);
    }
  }

  const onOtpSubmit: SubmitHandler<OtpFormValues> = async (data) => {
    setIsLoading(true);
    try {
        await signInWithPhoneNumber(data.otp);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: (error as Error).message,
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
        await signInWithGoogle();
    } catch(error) {
         toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
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
          <CardTitle className="font-headline">Welcome Back</CardTitle>
          <CardDescription>Sign in to continue your fitness journey.</CardDescription>
        </CardHeader>
        <CardContent>
            {step === 'otp' ? (
                <OtpVerificationForm 
                    form={otpForm}
                    onSubmit={onOtpSubmit}
                    isLoading={isLoading}
                    phoneNumber={phoneNumber}
                    onBack={() => setStep('input')}
                />
            ) : (
                <>
                    { signinMethod === 'phone' ? (
                        <PhoneSignInForm 
                            form={phoneForm}
                            onSubmit={onPhoneSubmit}
                            isLoading={isLoading}
                        />
                    ) : (
                        <EmailSignInForm 
                            form={emailForm}
                            onSubmit={onEmailSubmit}
                            isLoading={isLoading}
                        /> 
                    )}

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    { signinMethod === 'phone' ? (
                        <Button variant="outline" onClick={() => setSigninMethod('email')} disabled={isLoading} className="w-full">
                            <Mail className="mr-2" /> Continue with Email
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setSigninMethod('phone')} disabled={isLoading} className="w-full">
                            <MessageSquare className="mr-2" /> Continue with Phone
                        </Button>
                    )}

                    <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full mt-4">
                        {isLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Google</>}
                    </Button>
                </>
            )}
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
                </Link>
            </p>

        </CardContent>
      </Card>
    </div>
  );
}
