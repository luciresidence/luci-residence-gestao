import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const reportService = {
    generateMonthlyPDF: (data: any[], apartments: any[], title: string) => {
        const doc = new jsPDF();
        const waterReadings = data.filter(r => r.type === 'water');
        const gasReadings = data.filter(r => r.type === 'gas');

        // Page 1: Water
        doc.setFontSize(18);
        doc.text(`Relatório de Consumo - Água`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

        const waterTableData = waterReadings.map(r => {
            const ap = apartments.find(a => a.id === r.apartmentId);
            return [
                ap?.number || '-',
                ap?.block || '-',
                ap?.residentName || '-',
                r.previousValue.toFixed(3),
                r.currentValue.toFixed(3),
                (r.currentValue - r.previousValue).toFixed(3)
            ];
        });

        (doc as any).autoTable({
            startY: 40,
            head: [['Apto', 'Bloco', 'Morador', 'Anterior', 'Atual', 'Consumo']],
            body: waterTableData,
            theme: 'striped',
            headStyles: { fillStyle: '#802e53' }
        });

        // Page 2: Gas
        doc.addPage();
        doc.setFontSize(18);
        doc.text(`Relatório de Consumo - Gás`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

        const gasTableData = gasReadings.map(r => {
            const ap = apartments.find(a => a.id === r.apartmentId);
            return [
                ap?.number || '-',
                ap?.block || '-',
                ap?.residentName || '-',
                r.previousValue.toFixed(3),
                r.currentValue.toFixed(3),
                (r.currentValue - r.previousValue).toFixed(3)
            ];
        });

        (doc as any).autoTable({
            startY: 40,
            head: [['Apto', 'Bloco', 'Morador', 'Anterior', 'Atual', 'Consumo']],
            body: gasTableData,
            theme: 'striped',
            headStyles: { fillStyle: '#802e53' }
        });

        doc.save(`relatorio_mensal_${new Date().getTime()}.pdf`);
    },

    generateMonthlyExcel: (data: any[], apartments: any[]) => {
        const waterReadings = data.filter(r => r.type === 'water');
        const gasReadings = data.filter(r => r.type === 'gas');

        const formatData = (readings: any[]) => {
            return readings.map(r => {
                const ap = apartments.find(a => a.id === r.apartmentId);
                return {
                    'COND.': `${ap?.number} ${ap?.block}`,
                    'Unidade': ap?.residentName,
                    'Anterior': r.previousValue,
                    'Atual': r.currentValue,
                    'Consumo': r.currentValue - r.previousValue
                };
            });
        };

        const wb = XLSX.utils.book_new();

        const wsWater = XLSX.utils.json_to_sheet(formatData(waterReadings));
        XLSX.utils.book_append_sheet(wb, wsWater, "Consumo Água");

        const wsGas = XLSX.utils.json_to_sheet(formatData(gasReadings));
        XLSX.utils.book_append_sheet(wb, wsGas, "Consumo Gás");

        XLSX.writeFile(wb, `relatorio_consumo_${new Date().getTime()}.xlsx`);
    },

    generateIndividualPDF: (apartment: any, readings: any[], startDate?: string, endDate?: string) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Relatório Individual - Apto ${apartment.number}`, 14, 20);

        doc.setFontSize(12);
        doc.text(`Morador: ${apartment.residentName}`, 14, 30);
        doc.text(`Bloco: ${apartment.block}`, 14, 37);

        if (startDate && endDate) {
            doc.setFontSize(10);
            doc.text(`Período: ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`, 14, 45);
        }

        const tableData = readings.map(r => [
            r.date,
            r.type === 'water' ? 'Água' : 'Gás',
            r.previousValue.toFixed(3),
            r.currentValue.toFixed(3),
            (r.currentValue - r.previousValue).toFixed(3)
        ]);

        (doc as any).autoTable({
            startY: 55,
            head: [['Data', 'Tipo', 'Anterior', 'Atual', 'Consumo']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillStyle: '#802e53' }
        });

        doc.save(`relatorio_apto_${apartment.number}.pdf`);
    }
};
