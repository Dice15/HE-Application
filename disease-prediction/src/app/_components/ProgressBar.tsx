'use client'

export interface ProgressBarProps {
    progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div style={{ width: 'calc(100% - 10px)', height: '20px', backgroundColor: '#e0e0df', border: '2px solid #a2a2a2', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: (progress < 50 ? '#cdffd6' : progress < 80 ? '#51e96d' : '#0fbd2f'),
                transition: 'width 0.3s'
            }} />
        </div>
    );
}