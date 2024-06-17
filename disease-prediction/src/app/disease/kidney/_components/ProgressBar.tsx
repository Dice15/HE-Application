'use client'

import styled from "styled-components";

export interface ProgressBarProps {
    progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <Wrapper>
            <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: (progress < 50 ? '#8af59e' : progress < 80 ? '#51e96d' : '#0fbd2f'),
                transition: 'width 0.3s'
            }} />
        </Wrapper>
    );
}

const Wrapper = styled.div`
    width: 100%;
    height: calc(100% - 4px);
    background-color: #e0e0df;
    border: 2px solid #a2a2a2;
    border-radius: 5px;
    overflow: hidden;
`;