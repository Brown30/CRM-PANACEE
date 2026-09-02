import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * A shim that implements the python backend logic using Supabase directly,
 * but keeps the exact same axios-like interface (e.g., api.get().data).
 */

const getRole = async (userId) => {
  const { data } = await supabase.from('users').select('role').eq('id', userId).single();
  return data?.role;
};

// Helper to mimic axios response
const res = (data) => ({ data });

export const api = {
  get: async (url, config = {}) => {
    const params = config.params || {};
    
    if (url === '/auth/me') {
      const uId = localStorage.getItem('panacee_user_id');
      if (!uId) throw new Error('Not logged in');
      const { data } = await supabase.from('users').select('*').eq('id', uId).single();
      if (!data) throw new Error('User not found');
      return res({ user: data });
    }
    
    if (url === '/users') {
      const { data } = await supabase.from('users').select('*');
      return res({ users: data });
    }
    
    if (url === '/users/vendeurs') {
      const { data } = await supabase.from('users').select('*').eq('role', 'vendeur');
      return res({ vendeurs: data });
    }
    
    if (url === '/marathons') {
      const { data } = await supabase.from('marathons').select('*').eq('active', true);
      return res({ marathons: data });
    }
    
    if (url === '/marathons/all') {
      const { data } = await supabase.from('marathons').select('*');
      return res({ marathons: data });
    }
    
    if (url.match(/^\/marathons\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const { data } = await supabase.from('marathons').select('*').eq('id', id).single();
      return res({ marathon: data });
    }
    
    if (url.match(/^\/marathons\/([^/]+)\/time-remaining$/)) {
      const id = url.split('/')[2];
      const { data } = await supabase.from('marathons').select('*').eq('id', id).single();
      if (!data || !data.end_date) return res({ days_remaining: null, alert: null, time_percentage: 0 });
      
      const end = new Date(data.end_date);
      const today = new Date();
      if (end <= today) return res({ days_remaining: 0, alert: "Marathon terminée", time_percentage: 100 });
      
      let days = 0;
      let curr = new Date(today);
      while (curr < end) {
        curr.setDate(curr.getDate() + 1);
        if (curr.getDay() !== 0) days++; // skip sundays
      }
      
      let time_percentage = 0;
      if (data.start_date) {
        const start = new Date(data.start_date);
        const total = (end - start) / (1000 * 60 * 60 * 24);
        const elapsed = (today - start) / (1000 * 60 * 60 * 24);
        if (total > 0) time_percentage = Math.min(Math.max((elapsed / total) * 100, 0), 100).toFixed(1);
      }
      return res({
        days_remaining: days,
        alert: days <= 3 ? "Marathon proche de la fin" : days <= 7 ? "Moins d'une semaine restante" : null,
        time_percentage: Number(time_percentage)
      });
    }
    
    if (url === '/leads') {
      let q = supabase.from('leads').select('*').eq('marathon_id', params.marathon_id);
      if (params.vendeur_id) q = q.eq('vendeur_id', params.vendeur_id);
      if (params.status) q = q.eq('status', params.status);
      if (params.date) q = q.eq('date', params.date);
      const { data } = await q.order('date', { ascending: false });
      return res({ leads: data });
    }
    
    if (url === '/leads/count') {
      let q = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('marathon_id', params.marathon_id);
      if (params.exclude_status) q = q.neq('status', params.exclude_status);
      const { count } = await q;
      return res({ count: count || 0 });
    }

    if (url.match(/^\/leads\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const { data } = await supabase.from('leads').select('*').eq('id', id).single();
      return res({ lead: data });
    }

    if (url === '/dashboard/vendeur') {
      let q = supabase.from('leads').select('status, date').eq('marathon_id', params.marathon_id).eq('vendeur_id', params.vendeur_id);
      
      if (params.period && !['all', 'custom'].includes(params.period)) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(params.period));
        q = q.gte('date', cutoff.toISOString().split('T')[0]);
      }
      if (params.start_date && params.end_date) {
        q = q.gte('date', params.start_date).lte('date', params.end_date);
      }
      
      const { data: leads } = await q;
      const total_leads = leads.length;
      const inscrits = leads.filter(l => l.status === 'Inscrit').length;
      const tres_interesses = leads.filter(l => l.status === 'Très intéressé').length;
      
      const { data: mar } = await supabase.from('marathons').select('objectif_par_vendeur').eq('id', params.marathon_id).single();
      const objectif = (mar?.objectif_par_vendeur || {})[params.vendeur_id] || 0;
      
      return res({
        total_leads, inscrits, tres_interesses,
        taux_conversion: objectif > 0 ? Number(((inscrits / objectif) * 100).toFixed(1)) : 0,
        taux_closing: tres_interesses > 0 ? Number(((inscrits / tres_interesses) * 100).toFixed(1)) : 0,
        objectif,
        progression: objectif > 0 ? Math.min(Number(((inscrits / objectif) * 100).toFixed(1)), 100) : 0
      });
    }

    if (url === '/dashboard/admin') {
      let q = supabase.from('leads').select('*').eq('marathon_id', params.marathon_id);
      if (params.vendeur_id) q = q.eq('vendeur_id', params.vendeur_id);
      if (params.period && !['all', 'custom'].includes(params.period)) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(params.period));
        q = q.gte('date', cutoff.toISOString().split('T')[0]);
      }
      if (params.start_date && params.end_date) {
        q = q.gte('date', params.start_date).lte('date', params.end_date);
      }
      
      const { data: leads } = await q;
      const total_leads = leads.length;
      const inscrits = leads.filter(l => l.status === 'Inscrit').length;
      const tres_interesses = leads.filter(l => l.status === 'Très intéressé').length;
      
      const { data: mar } = await supabase.from('marathons').select('*').eq('id', params.marathon_id).single();
      const objectif_total = mar?.objectif_total || 0;
      
      const { data: vendeurs } = await supabase.from('users').select('*').eq('role', 'vendeur');
      const vendeur_stats = vendeurs.map(v => {
        const vLeads = leads.filter(l => l.vendeur_id === v.id);
        const vInscrits = vLeads.filter(l => l.status === 'Inscrit').length;
        const vTresInteresses = vLeads.filter(l => l.status === 'Très intéressé').length;
        const vTotal = vLeads.length;
        const vObj = (mar?.objectif_par_vendeur || {})[v.id] || 0;
        return {
          vendeur_id: v.id,
          vendeur_name: v.name,
          total_leads: vTotal,
          inscrits: vInscrits,
          objectif: vObj,
          taux_conversion: vObj > 0 ? Number(((vInscrits / vObj) * 100).toFixed(1)) : 0,
          taux_closing: vTresInteresses > 0 ? Number(((vInscrits / vTresInteresses) * 100).toFixed(1)) : 0
        };
      });

      return res({
        total_leads, inscrits, tres_interesses,
        taux_conversion: objectif_total > 0 ? Number(((inscrits / objectif_total) * 100).toFixed(1)) : 0,
        taux_closing: tres_interesses > 0 ? Number(((inscrits / tres_interesses) * 100).toFixed(1)) : 0,
        objectif_total,
        progression: objectif_total > 0 ? Math.min(Number(((inscrits / objectif_total) * 100).toFixed(1)), 100) : 0,
        vendeur_stats
      });
    }
    
    if (url === '/ranking') {
      const { data: vendeurs } = await supabase.from('users').select('*').eq('role', 'vendeur');
      const { data: leads } = await supabase.from('leads').select('vendeur_id, status').eq('marathon_id', params.marathon_id);
      let ranking = vendeurs.map(v => {
        const vl = leads.filter(l => l.vendeur_id === v.id);
        const ins = vl.filter(l => l.status === 'Inscrit').length;
        const tot = vl.length;
        return {
          vendeur_id: v.id,
          vendeur_name: v.name,
          inscrits: ins,
          total_leads: tot,
          taux_conversion: tot > 0 ? Number(((ins / tot) * 100).toFixed(1)) : 0
        };
      }).sort((a,b) => b.inscrits - a.inscrits);
      return res({ ranking });
    }
    
    if (url === '/reports') {
      let q = supabase.from('leads').select('*').eq('marathon_id', params.marathon_id);
      if (params.vendeur_id) q = q.eq('vendeur_id', params.vendeur_id);
      if (params.start_date && params.end_date) q = q.gte('date', params.start_date).lte('date', params.end_date);
      const { data: leads } = await q.order('date', { ascending: true });
      
      const dailyMap = {};
      leads.forEach(l => {
        const d = l.date || 'unknown';
        if(!dailyMap[d]) dailyMap[d] = { date: d, total: 0, inscrits: 0, tres_interesses: 0 };
        dailyMap[d].total++;
        if(l.status === 'Inscrit') dailyMap[d].inscrits++;
        else if(l.status === 'Très intéressé') dailyMap[d].tres_interesses++;
      });
      const daily = Object.values(dailyMap).sort((a,b) => a.date > b.date ? 1 : -1);
      
      const { data: vendeurs } = await supabase.from('users').select('*').eq('role', 'vendeur');
      const vendeurMap = Object.fromEntries(vendeurs.map(v => [v.id, v.name]));
      const par_vendeur_map = {};
      leads.forEach(l => {
        const vid = l.vendeur_id;
        if(!par_vendeur_map[vid]) par_vendeur_map[vid] = { vendeur_id: vid, vendeur_name: vendeurMap[vid] || 'Inconnu', total: 0, inscrits: 0, tres_interesses: 0 };
        par_vendeur_map[vid].total++;
        if(l.status === 'Inscrit') par_vendeur_map[vid].inscrits++;
        else if(l.status === 'Très intéressé') par_vendeur_map[vid].tres_interesses++;
      });
      const par_vendeur = Object.values(par_vendeur_map);
      
      return res({
        daily, par_vendeur,
        total_leads: leads.length,
        total_inscrits: leads.filter(l => l.status === 'Inscrit').length,
        total_tres_interesses: leads.filter(l => l.status === 'Très intéressé').length
      });
    }
    
    if (url === '/promises') {
      let q = supabase.from('leads').select('*').eq('marathon_id', params.marathon_id).eq('status', 'Très intéressé').not('promise_date', 'is', null).neq('promise_date', '');
      if (params.vendeur_id) q = q.eq('vendeur_id', params.vendeur_id);
      
      const today = new Date().toISOString().split('T')[0];
      if (params.filter_type === 'today') q = q.eq('promise_date', today);
      else if (params.filter_type === 'overdue') q = q.lt('promise_date', today);
      
      const { data } = await q.order('promise_date', { ascending: true });
      return res({ promises: data });
    }

    if (url === '/deletion-requests') {
      const { data } = await supabase.from('deletion_requests').select('*').eq('status', 'pending');
      return res({ requests: data });
    }

    if (url === '/notifications') {
      const { data, error } = await supabase.from('notifications').select('*').eq('vendeur_id', params.vendeur_id).order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return res({ notifications: data });
    }

    if (url === '/methodologies') {
      let q = supabase.from('sales_methodologies').select('*').order('formation', { ascending: true });
      if (params.marathon_id) q = q.eq('marathon_id', params.marathon_id);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return res({ methodologies: data });
    }

    if (url === '/attendance') {
      const { data: leads, error: leadsErr } = await supabase.from('leads').select('id, full_name, phone, status')
        .eq('marathon_id', params.marathon_id).in('status', ['Inscrit', 'Participant']).order('full_name', { ascending: true });
      if (leadsErr) throw new Error(leadsErr.message);
      const { data: att, error: attErr } = await supabase.from('attendance').select('lead_id, present')
        .eq('marathon_id', params.marathon_id).eq('date', params.date);
      if (attErr) throw new Error(attErr.message);
      const attMap = Object.fromEntries((att || []).map(a => [a.lead_id, a.present]));
      const roster = (leads || []).map(l => ({
        lead_id: l.id, full_name: l.full_name, phone: l.phone, status: l.status,
        present: attMap[l.id] ?? null
      }));
      return res({ roster });
    }

    if (url === '/attendance/dates') {
      const { data, error } = await supabase.from('attendance').select('date').eq('marathon_id', params.marathon_id);
      if (error) throw new Error(error.message);
      const dates = [...new Set((data || []).map(d => d.date))].sort((a, b) => b.localeCompare(a));
      return res({ dates });
    }

    console.warn("Unmocked GET", url);
    return res({});
  },
  
  post: async (url, payload = {}) => {
    if (url === '/auth/login') {
      const { data } = await supabase.from('users').select('*').eq('code', payload.code).single();
      if (!data) throw new Error("Code invalide");
      return res({ token: 'fake-jwt', user: data });
    }
    if (url === '/users') {
      const { data, error } = await supabase.from('users').insert({ ...payload, id: uuidv4() }).select().single();
      if (error) throw new Error(error.message);
      return res({ user: data });
    }
    if (url === '/marathons') {
      const { data } = await supabase.from('marathons').insert({ ...payload, id: uuidv4() }).select().single();
      return res({ marathon: data });
    }
    if (url === '/leads') {
      const { data, error } = await supabase.from('leads').insert({ ...payload, id: uuidv4() }).select().single();
      if (error) throw new Error(error.message);
      return res({ lead: data });
    }
    if (url.match(/^\/deletion-requests\/([^/]+)\/approve$/)) {
      const reqId = url.split('/')[2];
      const { data: dReq } = await supabase.from('deletion_requests').select('*').eq('id', reqId).single();
      if(dReq) {
        await supabase.from('leads').delete().eq('id', dReq.lead_id);
        await supabase.from('deletion_requests').update({ status: 'approved' }).eq('id', reqId);
      }
      return res({ message: 'Suppression approuvée' });
    }
    if (url.match(/^\/deletion-requests\/([^/]+)\/reject$/)) {
      const reqId = url.split('/')[2];
      await supabase.from('deletion_requests').update({ status: 'rejected' }).eq('id', reqId);
      return res({ message: 'Suppression rejetée' });
    }

    if (url === '/leads/bulk-redistribute') {
      const { source_marathon_id, target_marathon_id, exclude_status, allocations } = payload;

      let q = supabase.from('leads').select('*').eq('marathon_id', source_marathon_id);
      if (exclude_status) q = q.neq('status', exclude_status);
      const { data: candidates } = await q;

      const totalRequested = allocations.reduce((sum, a) => sum + a.quantity, 0);
      if (totalRequested > candidates.length) {
        throw new Error(`Apenas ${candidates.length} lead(s) disponível(is), mas ${totalRequested} foram solicitados`);
      }

      const { data: sourceMarathon } = await supabase.from('marathons').select('*').eq('id', source_marathon_id).single();
      const { data: targetMarathon } = await supabase.from('marathons').select('*').eq('id', target_marathon_id).single();

      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const today = new Date().toISOString().split('T')[0];

      let cursor = 0;
      let movedCount = 0;
      for (const { vendeur_id, quantity } of allocations) {
        const chunk = shuffled.slice(cursor, cursor + quantity);
        cursor += quantity;
        for (const lead of chunk) {
          const note = `Realocado da maratona "${sourceMarathon?.name || ''}" em ${today}`;
          const comments = lead.comments ? `${lead.comments}\n${note}` : note;
          await supabase.from('leads').update({
            marathon_id: target_marathon_id,
            vendeur_id,
            formation: targetMarathon?.formation,
            status: 'Potentiel',
            comments
          }).eq('id', lead.id);
          movedCount++;
        }
      }
      return res({ moved: movedCount });
    }

    if (url === '/notifications') {
      const { data, error } = await supabase.from('notifications').insert({ ...payload, id: uuidv4() }).select().single();
      if (error) throw new Error(error.message);
      return res({ notification: data });
    }

    if (url === '/methodologies') {
      const { data, error } = await supabase.from('sales_methodologies').insert({ ...payload, id: uuidv4() }).select().single();
      if (error) throw new Error(error.message);
      return res({ methodology: data });
    }

    if (url === '/attendance/mark') {
      const { marathon_id, lead_id, date, present } = payload;
      const { data: existing, error: findErr } = await supabase.from('attendance').select('id')
        .eq('marathon_id', marathon_id).eq('lead_id', lead_id).eq('date', date).maybeSingle();
      if (findErr) throw new Error(findErr.message);
      if (existing) {
        const { error } = await supabase.from('attendance').update({ present, updated_at: new Date().toISOString() }).eq('id', existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('attendance').insert({ id: uuidv4(), marathon_id, lead_id, date, present });
        if (error) throw new Error(error.message);
      }
      // Business rule: showing up for a session promotes an enrolled lead to Participant.
      if (present) {
        const { data: lead } = await supabase.from('leads').select('status').eq('id', lead_id).single();
        if (lead?.status === 'Inscrit') {
          await supabase.from('leads').update({ status: 'Participant' }).eq('id', lead_id);
        }
      }
      return res({ message: 'ok' });
    }
  },

  put: async (url, payload = {}) => {
    if (url.match(/^\/users\/([^/]+)\/code$/)) {
      const id = url.split('/')[2];
      const { data, error } = await supabase.from('users').update({ code: payload.code }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return res({ user: data });
    }
    if (url.match(/^\/users\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const { data, error } = await supabase.from('users').update(payload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return res({ user: data });
    }
    if (url.match(/^\/marathons\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const { data, error } = await supabase.from('marathons').update(payload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return res({ marathon: data });
    }
    if (url.match(/^\/leads\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const { data, error } = await supabase.from('leads').update(payload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return res({ lead: data });
    }
    if (url.match(/^\/notifications\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const { data, error } = await supabase.from('notifications').update(payload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return res({ notification: data });
    }
    if (url.match(/^\/methodologies\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const { data, error } = await supabase.from('sales_methodologies').update(payload).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return res({ methodology: data });
    }
  },
  
  delete: async (url) => {
    if (url.match(/^\/users\/([^/]+)$/)) {
      const id = url.split('/')[2];
      await supabase.from('users').delete().eq('id', id);
      return res({ message: 'Utilisateur supprimé' });
    }
    if (url.match(/^\/marathons\/([^/]+)$/)) {
      const id = url.split('/')[2];
      await supabase.from('marathons').update({ active: false }).eq('id', id);
      return res({ message: 'Marathon désactivée' });
    }
    if (url.match(/^\/leads\/([^/]+)$/)) {
      const id = url.split('/')[2];
      const uId = localStorage.getItem('panacee_user_id');
      const { data: me } = await supabase.from('users').select('*').eq('id', uId).single();

      if (me.role === 'admin_principal') {
        await supabase.from('leads').delete().eq('id', id);
        return res({ message: 'Lead supprimé' });
      } else {
        await supabase.from('deletion_requests').insert({
          id: uuidv4(), lead_id: id, vendeur_id: me.id, vendeur_name: me.name, status: 'pending'
        });
        return res({ message: 'Demande de suppression envoyée' });
      }
    }
    if (url.match(/^\/methodologies\/([^/]+)$/)) {
      const id = url.split('/')[2];
      await supabase.from('sales_methodologies').delete().eq('id', id);
      return res({ message: 'Méthodologie supprimée' });
    }
  }
};
