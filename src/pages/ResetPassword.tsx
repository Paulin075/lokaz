import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [forceManualEmail, setForceManualEmail] = useState(false);

  useEffect(() => {
    // Parse le hash de l'URL à l'initialisation
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const email = params.get('email');
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setEmail(email);
  }, []);

  // Timer de 5 secondes pour forcer l'affichage du champ email manuel
  useEffect(() => {
    if (!email && !forceManualEmail) {
      const timer = setTimeout(() => {
        setForceManualEmail(true);
      }, 5000); // 5 secondes
      return () => clearTimeout(timer);
    }
  }, [email, forceManualEmail]);

  // Fonction pour récupérer l'email via Supabase, avec délai après setSession
  const fetchEmail = useCallback(async () => {
    if (!email && accessToken && refreshToken) {
      setEmailLoading(true);
      setEmailError(false);
      const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (sessionError) {
        setEmailError(true);
        setEmailLoading(false);
        return;
      }
      // Attendre 1.5s pour laisser la session se propager
      await new Promise(res => setTimeout(res, 1500));
      const { data, error } = await supabase.auth.getUser();
      console.log('getUser result:', data, error);
      if (!error && data?.user?.email) {
        setEmail(data.user.email);
      } else {
        setEmailError(true);
      }
      setEmailLoading(false);
    }
  }, [email, accessToken, refreshToken]);

  // Lancer la récupération de l'email au montage si besoin
  useEffect(() => {
    if (!email && accessToken && refreshToken && !forceManualEmail) {
      fetchEmail();
    }
  }, [email, accessToken, refreshToken, fetchEmail, forceManualEmail]);

  // Fonction utilitaire pour timeout
  function timeoutPromise(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
  }

  const handleRetry = () => {
    fetchEmail();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const finalEmail = email || emailInput;
    console.log('--- RESET PASSWORD DEBUG ---');
    console.log('accessToken:', accessToken);
    console.log('refreshToken:', refreshToken);
    console.log('email utilisé:', finalEmail);
    if (!accessToken || !refreshToken) {
      setMessage("Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation de mot de passe depuis la page de connexion. Le lien n'est valable qu'une seule fois et expire après 1 heure.");
      console.log('Erreur : tokens manquants');
      return;
    }
    if (!finalEmail || !finalEmail.includes('@')) {
      setMessage('Veuillez saisir une adresse email valide.');
      console.log('Erreur : email invalide');
      return;
    }
    if (password.length < 6) {
      setMessage('Le mot de passe doit contenir au moins 6 caractères.');
      console.log('Erreur : mot de passe trop court');
      return;
    }
    if (password !== confirm) {
      setMessage('Les mots de passe ne correspondent pas.');
      console.log('Erreur : mots de passe différents');
      return;
    }
    setLoading(true);
    // Log avant setSession
    console.log('Appel setSession...');
    let sessionError;
    try {
      const { error } = await timeoutPromise(
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
        7000 // 7 secondes
      );
      sessionError = error;
    } catch (err) {
      sessionError = err;
    }
    if (sessionError) {
      setMessage('Erreur de session : ' + sessionError.message);
      setLoading(false);
      console.log('Erreur setSession:', sessionError);
      return;
    }
    console.log('setSession OK, appel updateUser...');
    const { data: updateData, error } = await supabase.auth.updateUser({ password });
    console.log('Résultat updateUser:', updateData, error);
    if (error) {
      setMessage('Erreur : ' + error.message);
      console.log('Erreur updateUser:', error);
    } else {
      setMessage('Mot de passe réinitialisé avec succès ! Redirection...');
      setTimeout(() => navigate('/login'), 2000);
      console.log('Mot de passe réinitialisé avec succès !');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* Debug visuel du state React */}
      {/* <pre style={{fontSize: 12, color: 'gray', marginBottom: 8}}>
        {JSON.stringify({ accessToken, refreshToken, email, emailLoading, emailError }, null, 2)}
      </pre> */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Réinitialisation du mot de passe</h2>
        <div className="mb-2 text-center text-gray-700 font-semibold min-h-[24px]">
          {email && !forceManualEmail ? (
            email
          ) : (forceManualEmail || emailError) ? (
            <>
              {emailError && !forceManualEmail && (
                <>
                  <span className="text-red-500">Impossible de récupérer l'adresse email.</span>
                  <button type="button" className="ml-2 underline text-lokaz-orange" onClick={handleRetry}>
                    Réessayer
                  </button>
                </>
              )}
              <div className="mt-4">
                <input
                  type="email"
                  className="border p-2 w-full rounded"
                  placeholder="Votre adresse email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  required
                />
                {forceManualEmail && !emailError && (
                  <div className="text-xs text-gray-400 mt-2">
                    L'adresse email n'a pas pu être récupérée automatiquement. Veuillez la saisir manuellement pour continuer.
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400">Chargement de l'adresse email...</span>
          )}
        </div>
        <div className="mb-4 text-gray-500 text-sm text-center">
          Veuillez saisir un nouveau mot de passe et le confirmer pour accéder à votre compte.<br/>
          <span className="text-xs text-gray-400">Le lien de réinitialisation n'est valable qu'une seule fois et expire après 1 heure. Si vous voyez 'lien expiré', refaites une demande depuis la page de connexion.</span>
        </div>
        <input
          type="password"
          className="border p-2 w-full mb-4 rounded"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="border p-2 w-full mb-4 rounded"
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-lokaz-orange text-white px-4 py-2 rounded w-full"
          disabled={loading || !(email || emailInput)}
        >
          {loading ? 'Enregistrement...' : 'Valider'}
        </button>
        {message && <div className="mt-4 text-center text-red-600">{message}</div>}
      </form>
    </div>
  );
};

export default ResetPassword; 