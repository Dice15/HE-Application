"use client"

import { Dispatch, SetStateAction, useCallback } from "react";
import styled from "styled-components";


export interface PredictModelSelectorProps {
    predictModel: "linear" | "logistic";
    setPredictModel: Dispatch<SetStateAction<"linear" | "logistic">>;
}


export default function PredictModelSelector({ predictModel, setPredictModel }: PredictModelSelectorProps) {
    // hanlder
    const handleModelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPredictModel(event.target.value as ("linear" | "logistic"));
    }, [setPredictModel]);


    return (
        <Wrapper>
            <ModelName>
                <input
                    type="radio"
                    value="linear"
                    checked={predictModel === 'linear'}
                    onChange={handleModelChange}
                />
                선형 회귀 모델
            </ModelName>
            <ModelName>
                <input
                    type="radio"
                    value="logistic"
                    checked={predictModel === 'logistic'}
                    onChange={handleModelChange}
                />
                로지스틱 회귀 모델
            </ModelName>
        </Wrapper>
    );
}


const Wrapper = styled.div`
    height: calc(30% - 2%);
    width: calc(100% - 2%);
    padding: 1%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ModelName = styled.label`
    margin: 0 1vw;
    font-size: 1.5vh;
    font-weight: bold;
`;