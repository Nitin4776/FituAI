
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Sparkles, Video, Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Input } from './ui/input';
import { saveProfile } from '@/services/firestore';

const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const PhotoInput = ({ label, onPhotoSelect, photo }: { label: string, onPhotoSelect: (photo: File) => void, photo: File | null }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [cameraMode, setCameraMode] = useState<'capture' | 'upload' | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!isDialogOpen) {
            setCameraMode(null);
        }
    }, [isDialogOpen]);

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (cameraMode === 'capture') {
            const getCameraPermission = async () => {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    setHasCameraPermission(true);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Camera Access Denied',
                        description: 'Please enable camera permissions in your browser settings.',
                    });
                }
            };
            getCameraPermission();
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }, [cameraMode, toast]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        onPhotoSelect(new File([blob], `${label.toLowerCase().replace(' ', '-')}.jpg`, { type: 'image/jpeg' }));
                        setIsDialogOpen(false);
                    }
                }, 'image/jpeg');
            }
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onPhotoSelect(file);
            setIsDialogOpen(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Card className="flex items-center justify-center p-2 min-h-[150px] bg-secondary/50">
                {photo ? (
                    <div className="relative w-32 h-32">
                        <Image src={URL.createObjectURL(photo)} alt={`${label} preview`} layout="fill" objectFit="cover" className="rounded-md" />
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground text-sm">
                        <p>No Photo Added</p>
                    </div>
                )}
            </Card>
            <Button variant="outline" className="w-full" onClick={() => setIsDialogOpen(true)}>Add {label}</Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add {label}</DialogTitle>
                        <DialogDescription>Choose how you want to provide the photo.</DialogDescription>
                    </DialogHeader>
                    {!cameraMode ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8">
                            <Button variant="outline" className="h-24 text-lg" onClick={() => setCameraMode('capture')}><Camera className="mr-2" /> Capture</Button>
                            <Button variant="outline" className="h-24 text-lg" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2" /> Upload</Button>
                            <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                    ) : cameraMode === 'capture' ? (
                        <div className="space-y-4">
                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                    <AlertTitle>Camera Access Denied</AlertTitle>
                                </Alert>
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                            <Button className="w-full" onClick={handleCapture} disabled={!hasCameraPermission}><Camera className="mr-2" /> Capture Photo</Button>
                            <Button variant="ghost" onClick={() => setCameraMode(null)}>Back</Button>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};


export function AiBodyScan() {
    const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
    const [backPhoto, setBackPhoto] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ heightCm: number; weightKg: number; age: number; } | null>(null);
    const { toast } = useToast();

    const handleAnalyze = async () => {
        if (!frontPhoto || !backPhoto) {
            toast({ variant: 'destructive', title: 'Please upload both photos.' });
            return;
        }
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            const [frontPhotoDataUri, backPhotoDataUri] = await Promise.all([
                toDataURL(frontPhoto),
                toDataURL(backPhoto),
            ]);

            const response = await fetch('/api/analyze-vitals', {
                method: 'POST',
                body: JSON.stringify({ frontPhotoDataUri, backPhotoDataUri }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to analyze photos.');
            
            const result = await response.json();
            setAnalysisResult(result);
            toast({ title: 'Analysis Complete!', description: 'Your estimated vitals are shown below.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: (error as Error).message });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSaveToProfile = async () => {
        if (!analysisResult) return;
        try {
            await saveProfile({
                height: Math.round(analysisResult.heightCm),
                weight: Math.round(analysisResult.weightKg),
                age: Math.round(analysisResult.age)
            });
            toast({ title: 'Profile Updated!', description: 'Your details have been saved to your profile.'});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
        }
    }

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Upload Your Photos</CardTitle>
                    <CardDescription>
                        For best results, wear form-fitting clothes and stand in a neutral pose against a plain background.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <PhotoInput label="Front Photo" photo={frontPhoto} onPhotoSelect={setFrontPhoto} />
                        <PhotoInput label="Back Photo" photo={backPhoto} onPhotoSelect={setBackPhoto} />
                    </div>
                    <Button onClick={handleAnalyze} disabled={!frontPhoto || !backPhoto || isAnalyzing} className="w-full">
                        {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Analyze with AI'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">AI Analysis Results</CardTitle>
                    <CardDescription>
                        Here are the vitals estimated by the AI. You can save them to your profile.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isAnalyzing ? (
                         <div className="flex flex-col items-center justify-center h-48 text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">The AI is analyzing your photos...<br/>This may take a moment.</p>
                        </div>
                    ) : analysisResult ? (
                        <>
                            <div className="space-y-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 p-4">
                                <div className="flex justify-between items-center">
                                    <Label>Estimated Height</Label>
                                    <span className="font-bold">{Math.round(analysisResult.heightCm)} cm</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label>Estimated Weight</Label>
                                    <span className="font-bold">{Math.round(analysisResult.weightKg)} kg</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label>Estimated Age</Label>
                                    <span className="font-bold">{Math.round(analysisResult.age)} years</span>
                                </div>
                            </div>
                            <Alert>
                                <AlertTitle className="text-primary/80">AI Disclaimer</AlertTitle>
                                <AlertDescription>
                                    AI can make mistakes. These values are estimates. For precise measurements, please consult a professional.
                                </AlertDescription>
                            </Alert>
                             <Button onClick={handleSaveToProfile} className="w-full">
                                <Save className="mr-2"/>
                                Save to Profile
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                            <p>Upload and analyze your photos to see your estimated vitals here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
