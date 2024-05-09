'use client'

interface ProgressBarProps {
    progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div style={{ width: '100%', height: '20px', backgroundColor: '#e0e0df', borderRadius: '5px', overflow: 'hidden', marginTop: '20px' }}>
            <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: progress < 100 ? '#76c7c0' : '#4caf50',
                transition: 'width 0.3s'
            }} />
        </div>
    );
}