"use client"

import styled from "styled-components";


export interface PatientTableProps {
    tableTitle: string;
    patientData: any[];
    diseasePredictions: number[];
}


export default function PatientTable({ tableTitle, patientData, diseasePredictions }: PatientTableProps) {
    // render
    return (
        <Wrapper>
            {patientData.length > 0 &&
                <>
                    <Title>
                        {tableTitle}
                    </Title>
                    <Content>
                        <Table>
                            <thead>
                                <tr>
                                    {Object.keys(patientData[0])
                                        .map((feature, index) => (
                                            <th key={index} style={{ border: '1px solid black', padding: '8px', backgroundColor: '#cbcbcb' }}>
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
                                        {Object.keys(patientData[0])
                                            .map((feature, colIndex) => (
                                                <td key={colIndex} style={{ border: '1px solid black', padding: '8px' }}>
                                                    {feature === 'classification'
                                                        ? (diseasePredictions[rowIndex] === undefined || diseasePredictions[rowIndex] === 2) ? ' ' : diseasePredictions[rowIndex] ? '신장 질환' : '정상'
                                                        : row[feature]
                                                    }
                                                </td>
                                            ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Content>
                </>
            }
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