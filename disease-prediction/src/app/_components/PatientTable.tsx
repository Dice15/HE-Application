"use client"

export interface PatientTableProps {
    title: string;
    data: any[];
    result: boolean[];
}

export default function PatientTable({ title, data, result }: PatientTableProps) {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: "column", alignItems: 'center' }}>
            <h2>{title}</h2>
            <div style={{ width: '100%', maxWidth: '100%', height: 'calc(100% - 20px)', maxHeight: 'calc(100% - 20px)', paddingTop: '20px', overflowY: 'scroll', overflowX: 'scroll' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            {(data.length > 0 ? Object.keys(data[0]) : []).map((header, index) => (
                                <th key={index} style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f2f2f2' }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} style={{ backgroundColor: `${result[rowIndex] ? '#FFA3A3' : '#f2f2f2'}` }}>
                                {(data.length > 0 ? Object.keys(data[0]) : []).map((header, colIndex) => (
                                    <td key={colIndex} style={{ border: '1px solid black', padding: '8px' }}>
                                        {row[header]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}