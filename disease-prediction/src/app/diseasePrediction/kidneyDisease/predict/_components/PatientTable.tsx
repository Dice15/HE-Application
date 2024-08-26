"use client"

import { TableVirtuoso } from 'react-virtuoso';
import styled from 'styled-components';

export interface PatientTableProps {
    tableTitle: string;
    patientData: any[];
    diseasePredictions: number[];
}

export default function PatientTable({ tableTitle, patientData, diseasePredictions }: PatientTableProps) {
    const columns = Object.keys(patientData[0] || {});

    return (
        <Wrapper>
            {patientData.length > 0 && (
                <>
                    <Title>{tableTitle}</Title>
                    <Content>
                        <TableVirtuoso
                            data={patientData}
                            components={{
                                Table: (props) => {
                                    const { context, ...restProps } = props;
                                    return <Table {...restProps} />;
                                },
                            }}
                            fixedHeaderContent={() => (
                                <tr>
                                    {columns.map((column, index) => (
                                        <TableTh key={index} $isFirst={index === 0}>
                                            {column}
                                        </TableTh>
                                    ))}
                                </tr>
                            )}
                            itemContent={(index, row) => (
                                <>
                                    {columns.map((feature, colIndex) => (
                                        <TableTd
                                            key={colIndex}
                                            $isFirst={colIndex === 0}
                                            $prediction={diseasePredictions[index]}
                                        >
                                            {feature === 'classification'
                                                ? diseasePredictions[index] === undefined || diseasePredictions[index] === 2
                                                    ? '-'
                                                    : diseasePredictions[index] ? 'Kidney Disease' : 'Normal'
                                                : row[feature] || '-'}
                                        </TableTd>
                                    ))}
                                </>
                            )}
                        />
                    </Content>
                </>
            )}
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
    margin-bottom: 20px;
    color: #3182F6;
`;

const Content = styled.div`
    height: calc(100% - 45px - 4px);
    border: 2px solid #000000;
    width: 100%;
    overflow: auto;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    table-layout: auto; 
    text-align: center;
`;

const TableTh = styled.th<{ $isFirst: boolean }>`
    padding: 8px;
    box-shadow: inset 1px 0 0 0 black;
    background-color: #cbcbcb;
 
    ${({ $isFirst }) => $isFirst && `
        box-shadow: none;
    `}
`;

const TableTd = styled.td<{ $isFirst: boolean, $prediction: number | undefined }>`
    user-select: text;
    padding: 8px;
    box-shadow: inset 1px 0 0 0 black;
    background-color: ${({ $prediction }) =>
        $prediction === undefined || $prediction === 2
            ? '#f2f2f2'
            : $prediction ? '#FFA3A3' : '#89baff'
    };

    ${({ $isFirst }) => $isFirst && `
        box-shadow: none;
    `}
`;
