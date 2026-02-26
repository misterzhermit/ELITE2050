import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
    const baseClass = "relative overflow-hidden bg-white/5";
    const shimmerClass = "after:content-[''] after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/[0.05] after:to-transparent after:animate-[shimmer_2s_infinite]";

    const variantClasses = {
        text: "h-3 w-3/4 rounded-lg",
        rect: "w-full h-full rounded-2xl",
        circle: "rounded-full"
    };

    return (
        <div className={`${baseClass} ${shimmerClass} ${variantClasses[variant]} ${className}`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}} />
        </div>
    );
};

export const PlayerCardSkeleton = () => (
    <div className="p-4 rounded-2xl border border-white/5 bg-black/20 space-y-3">
        <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="w-10 h-10" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-24" />
                <Skeleton variant="text" className="w-16" />
            </div>
        </div>
        <div className="grid grid-cols-5 gap-1">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 rounded-lg" />
            ))}
        </div>
    </div>
);
