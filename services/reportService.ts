import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const reportService = {
    generateMonthlyPDF: (data: any[], apartments: any[], title: string) => {
        const doc = new jsPDF();

        // Helper to sort by unit number
        const sortByUnit = (a: any, b: any) => {
            const apA = apartments.find(ap => ap.id === a.apartment_id);
            const apB = apartments.find(ap => ap.id === b.apartment_id);
            if (!apA || !apB) return 0;

            const nA = parseInt(apA.number);
            const nB = parseInt(apB.number);
            const isNumA = !isNaN(nA);
            const isNumB = !isNaN(nB);

            // Unidades com texto (ex: COND. AB) sempre primeiro
            if (!isNumA && isNumB) return -1;
            if (isNumA && !isNumB) return 1;

            if (!isNumA && !isNumB) {
                return apA.number.localeCompare(apB.number);
            }

            // Unidades numéricas: ordenar por bloco (A antes de B)
            if (apA.block !== apB.block) {
                return apA.block.localeCompare(apB.block);
            }

            // Mesmo bloco: ordenar por número
            return nA - nB;
        };

        const waterReadings = data.filter(r => r.type === 'water').sort(sortByUnit);
        const gasReadings = data.filter(r => r.type === 'gas').sort(sortByUnit);

        const hasWater = waterReadings.length > 0;
        const hasGas = gasReadings.length > 0;

        if (!hasWater && !hasGas) {
            alert('Não há dados para gerar o relatório.');
            return;
        }

        const headerText = `Condomínio Luci Berkembrock referente ao mês ${title}`;

        // --- GERAÇÃO ÁGUA ---
        if (hasWater) {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(headerText, 14, 20);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 102, 204); // Blue for Water
            doc.text(`Relatório de Consumo - Água`, 14, 32);

            const waterTableData = waterReadings.map(r => {
                const ap = apartments.find(a => a.id === r.apartment_id);
                const prev = Number(r.previous_value) || 0;
                const curr = Number(r.current_value) || 0;
                const consumption = curr - prev;

                return [
                    ap ? (isNaN(parseInt(ap.number)) ? ap.number : `${ap.number} ${ap.block}`) : '-',
                    ap?.residentName || '-',
                    prev.toFixed(2),
                    curr.toFixed(2),
                    consumption.toFixed(2)
                ];
            });

            (doc as any).autoTable({
                startY: 40,
                head: [['UNIDADE', 'MORADOR', 'ANTERIOR', 'ATUAL', 'CONSUMO']],
                body: waterTableData,
                theme: 'striped',
                headStyles: { fillColor: [0, 102, 204] },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    4: { fontStyle: 'bold', textColor: [0, 102, 204] }
                }
            });
        }

        // --- GERAÇÃO GÁS ---
        if (hasGas) {
            // Se já gerou água, adiciona nova página
            if (hasWater) {
                doc.addPage();
            }

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(headerText, 14, 20);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(204, 82, 0); // Orange for Gas
            doc.text(`Relatório de Consumo - Gás`, 14, 32);

            const gasTableData = gasReadings.map(r => {
                const ap = apartments.find(a => a.id === r.apartment_id);
                const prev = Number(r.previous_value) || 0;
                const curr = Number(r.current_value) || 0;
                const consumption = curr - prev;

                return [
                    ap ? (isNaN(parseInt(ap.number)) ? ap.number : `${ap.number} ${ap.block}`) : '-',
                    ap?.residentName || '-',
                    prev.toFixed(3),
                    curr.toFixed(3),
                    consumption.toFixed(3)
                ];
            });

            (doc as any).autoTable({
                startY: 40,
                head: [['UNIDADE', 'MORADOR', 'ANTERIOR', 'ATUAL', 'CONSUMO']],
                body: gasTableData,
                theme: 'striped',
                headStyles: { fillColor: [204, 82, 0] },
                columnStyles: {
                    0: { fontStyle: 'bold' },
                    4: { fontStyle: 'bold', textColor: [204, 82, 0] }
                }
            });
        }

        doc.save = {`relatorio_mensal_${new Date().getTime()}.pdf`);
    },

    generateMonthlyExcel: (data: any[], apartments: any[]) => {
        // Helper to sort by unit number
        const sortByUnit = (a: any, b: any) => {
            const apA = apartments.find(ap => ap.id === a.apartment_id);
            const apB = apartments.find(ap => ap.id === b.apartment_id);
            if (!apA || !apB) return 0;

            const nA = parseInt(apA.number);
            const nB = parseInt(apB.number);
            const isNumA = !isNaN(nA);
            const isNumB = !isNaN(nB);

            // Unidades com texto (ex: COND. AB) sempre primeiro
            if (!isNumA && isNumB) return -1;
            if (isNumA && !isNumB) return 1;

            if (!isNumA && !isNumB) {
                return apA.number.localeCompare(apB.number);
            }

            // Unidades numéricas: ordenar por bloco (A antes de B)
            if (apA.block !== apB.block) {
                return apA.block.localeCompare(apB.block);
            }

            // Mesmo bloco: ordenar por número
            return nA - nB;
        };

        const waterReadings = data.filter(r => r.type === 'water').sort(sortByUnit);
        const gasReadings = data.filter(r => r.type === 'gas').sort(sortByUnit);

        const formatData = (readings: any[], precision: number) => {
            return readings.map(r => {
                const ap = apartments.find(a => a.id === r.apartment_id);
                const prev = Number(r.previous_value) || 0;
                const curr = Number(r.current_value) || 0;
                const consumption = curr - prev;

                // Formato exigido: UNIDADE | MORADOR | ANTERIOR | ATUAL | CONSUMO
                // Unidade deve ser "COND. AB" ou "001 A"
                const unitLabel = ap ? (isNaN(parseInt(ap.number)) ? ap.number : `${ap.number} ${ap.block}`) : '-';

                return {
                    'UNIDADE': unitLabel,
                    'MORADOR': ap?.residentName || '-',
                    'ANTERIOR': prev.toFixed(precision),
                    'ATUAL': curr.toFixed(precision),
                    'CONSUMO': consumption.toFixed(precision).replace('.', ',') // Excel BR usa vírgula
                };
            });
        };

        // Obter mês/ano do primeiro registro para o título, caso venha vazio, ou usar placeholder
        let titleSuffix = "";
        if (data.length > 0) {
            const d = new Date(data[0].date);
            const month = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            titleSuffix = month.charAt(0).toUpperCase() + month.slice(1);
        }
        const headerText = `Condomínio Luci Berkembrock referente ao mês ${titleSuffix}`;

        const wb = XLSX.utils.book_new();

        // Water Sheet
        // Create sheet with header at A1
        const wsWater = XLSX.utils.aoa_to_sheet([[headerText]]);
        // Add data starting at A3
        XLSX.utils.sheet_add_json(wsWater, formatData(waterReadings, 2), { origin: "A3", skipHeader: false });

        wsWater['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
        // Ajustar largura das colunas
        wsWater['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsWater, "Consumo Água");

        // Gas Sheet
        const wsGas = XLSX.utils.aoa_to_sheet([[headerText]]);
        XLSX.utils.sheet_add_json(wsGas, formatData(gasReadings, 3), { origin: "A3", skipHeader: false });

        wsGas['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
        wsGas['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsGas, "Consumo Gás");

        XLSX.writeFile(wb, `relatorio_consumo_${new Date().getTime()}.xlsx`);
    },

    generateIndividualPDF: (apartment: any, readings: any[], startDate?: string, endDate?: string) => {
        const doc = new jsPDF();

        let subTitle = "";
        if (startDate && endDate) {
            subTitle = `referente ao período ${new Date(startDate).toLocaleDateString()} a ${new Date(endDate).toLocaleDateString()}`;
        } else {
            const now = new Date();
            const month = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            subTitle = `referente ao mês ${month.charAt(0).toUpperCase() + month.slice(1)}`;
        }

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`Condomínio Luci Berkembrock ${subTitle}`, 14, 20);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Relatório Individual - Apto ${apartment.number} ${apartment.block}`, 14, 32);
        doc.text(`Morador: ${apartment.residentName}`, 14, 38);

        const tableData = readings.map(r => {
            const prev = Number(r.previous_value) || 0;
            const curr = Number(r.current_value) || 0;
            const consumption = curr - prev;
            const precision = r.type === 'water' ? 2 : 3;

            return [
                new Date(r.date).toLocaleDateString('pt-BR'),
                r.type === 'water' ? 'Água' : 'Gás',
                prev.toFixed(precision),
                curr.toFixed(precision),
                consumption.toFixed(precision)
            ];
        });

        (doc as any).autoTable({
            startY: 45,
            head: [['DATA', 'TIPO', 'ANTERIOR', 'ATUAL', 'CONSUMO']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [128, 46, 83] }
        });

        doc.save(`relatorio_apto_${apartment.number}.pdf`);
    }
};
