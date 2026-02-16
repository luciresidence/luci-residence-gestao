
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blixowofssbimudbrejm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaXhvd29mc3NiaW11ZGJyZWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzcyNjksImV4cCI6MjA4NDM1MzI2OX0.28TcTxfnLUFr-CJ-4C7sTVSyrd_jDVkaf46qEIl4Sbo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteMarchReadings() {
    console.log('Searching for March 2026 readings for apts 001 and 002...');

    // 1. Check if apartments exist (try 001/002 and 1/2)
    const { data: apts, error: aptError } = await supabase
        .from('apartments')
        .select('id, number')
        .in('number', ['001', '002', '1', '2']);

    if (aptError) {
        console.error('Error fetching apartments:', aptError);
    }

    if (!apts || apts.length === 0) {
        console.log('Apartments 001, 002, 1, 2 not found. Trying simple list...');
        const { data: allApts } = await supabase.from('apartments').select('id, number').limit(5);
        console.log('First 5 apts:', allApts);
        return;
    }

    console.log('Found apartments:', apts);
    const aptIds = apts.map(a => a.id);

    // 2. Fetch readings to confirm before delete
    const startDate = '2026-03-01T00:00:00.000Z';
    const endDate = '2026-04-01T00:00:00.000Z';

    const { data: readings, error: readError } = await supabase
        .from('readings')
        .select('*')
        .in('apartment_id', aptIds)
        .gte('date', startDate)
        .lt('date', endDate);

    if (readError) {
        console.error('Error fetching readings:', readError);
        return;
    }

    console.log(`Found ${readings.length} readings for March 2026.`);

    if (readings.length > 0) {
        // 3. Try to DELETE
        const readingIds = readings.map(r => r.id);
        const { error: deleteError } = await supabase
            .from('readings')
            .delete()
            .in('id', readingIds);

        if (deleteError) {
            console.error('Error deleting readings:', deleteError);
            console.log('Likely need Service Role Key or authenticated user.');
        } else {
            console.log('Successfully deleted readings:', readingIds);
        }
    } else {
        console.log('No readings found in this range.');
    }
}

deleteMarchReadings();
