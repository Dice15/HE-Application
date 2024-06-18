"use client"

import styled from "styled-components";

export interface PatientTableProps {
    tableTitle: string;
    patientData: any[];
    diseasePredictions: number[];
}

export default function PatientTable({ tableTitle, patientData, diseasePredictions }: PatientTableProps) {
    return (
        <Wrapper>
            <Title>
                {patientData.length > 0 ? tableTitle : ""}
            </Title>
            <Content>
                <Table>
                    <thead>
                        <tr>
                            {(patientData.length > 0 ? Object.keys(patientData[0]).filter((value => value !== 'classification')) : [])
                                .map((feature, index) => (
                                    <th key={index} style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f2f2f2' }}>
                                        {feature}
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {patientData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                style={{
                                    backgroundColor: `${(diseasePredictions[rowIndex] === undefined || diseasePredictions[rowIndex] === 2) ? '#f2f2f2' : diseasePredictions[rowIndex] ? '#FFA3A3' : '#89baff'}`
                                }}
                            >
                                {(patientData.length > 0 ? Object.keys(patientData[0]).filter((value => value !== 'classification')) : [])
                                    .map((feature, colIndex) => (
                                        <td key={colIndex} style={{ border: '1px solid black', padding: '8px' }}>
                                            {row[feature]}
                                        </td>
                                    ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Content>
        </Wrapper>
    );
}


const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
`;

const Title = styled.h3`
    font-size: 25px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #3182F6; 
`;

const Content = styled.div`
    height: calc(100% - 35px);
    width: 100%;
    overflow: scroll;
`;

const Table = styled.table`
    height:100%;
    width: 100%;
    border-collapse: collapse;
`;

//width: '100%', maxWidth: '100%', height: 'calc(100% - 20px)', maxHeight: 'calc(100% - 20px)', paddingTop: '20px', overflowY: 'scroll', overflowX: 'scroll'