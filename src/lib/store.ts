fetchColumnsAndLeads: async (clientId) => {
  const { client, isAdmin } = get();
  const targetClientId = clientId || client?.id;

  if (!targetClientId && !isAdmin) {
    console.warn('❌ Nenhum clientId disponível para buscar colunas.');
    set({ isLoadingData: false });
    return;
  }

  set({ isLoadingData: true });

  // ✅ Query de columns
  let columnQuery = supabase.from('columns').select('*');

  if (!isAdmin) {
    columnQuery = columnQuery.eq('client_id', targetClientId);
  }

  columnQuery = columnQuery.order('order');

  const { data: columnsData, error: columnsError } = await columnQuery;

  if (columnsError) {
    console.error('❌ Erro ao buscar colunas:', columnsError);
    set({ isLoadingData: false });
    return;
  }

  // ✅ Query de leads
  let leadsQuery = supabase.from('leads').select('*');

  if (!isAdmin) {
    leadsQuery = leadsQuery.eq('client_id', targetClientId);
  }

  const { data: leadsData, error: leadsError } = await leadsQuery;

  if (leadsError) {
    console.error('❌ Erro ao buscar leads:', leadsError);
    set({ isLoadingData: false });
    return;
  }

  const columns = columnsData.map(column => ({
    ...column,
    leads: leadsData.filter(lead => lead.column_id === column.id)
  }));

  set({
    columns,
    leads: leadsData,
    isLoadingData: false
  });
}