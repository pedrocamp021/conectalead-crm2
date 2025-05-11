fetchUserData: async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    set({ isLoading: false });
    return;
  }

  const isAdmin = user.email?.includes('admin') || false;

  if (isAdmin) {
    set({
      user: { id: user.id, email: user.email!, role: 'admin' },
      isAdmin: true,
      isLoading: false
    });
    return;
  }

  // ✅ Correção: buscar client pelo ID, que é igual ao auth.uid()
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', user.id) // <- aqui é a correção
    .single();

  if (clientError || !clientData) {
    console.warn('⚠️ Cliente não encontrado para o usuário:', user.email);
    set({
      user: { id: user.id, email: user.email!, role: 'client' },
      client: null,
      isLoading: false
    });
    return;
  }

  set({
    user: { id: user.id, email: user.email!, role: 'client' },
    client: clientData,
    isLoading: false
  });
},
