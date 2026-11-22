// Pagina a la que lleva el QR de invitacion cuando se escanea con la camara del movil (sin la app).
// Se sirve desde GitHub Pages (siempre en linea: no depende del PC ni del wifi) y, como respaldo, desde el propio servidor.
// Los datos van detras del «#»: el navegador no los manda a ningun servidor, asi que la clave de cifrado no pasa por ellos.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var APK_GITHUB = 'https://github.com/Danix29/casco-sos-releases/releases/latest/download/CascoSOS-debug.apk';
  var enPaginas = /\.github\.io$/.test(location.hostname);        // la pagina publica; si no, la del propio servidor

  /** Texto UTF-8 desde base64url, o null. */
  function decodificar(b64u) {
    try {
      var b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) { return null; }
  }

  /** La invitacion de un contacto (version 1) o null. Solo se mira lo imprescindible: la valida de verdad quien la use. */
  function leer(datos) {
    var texto = decodificar(datos); if (!texto) return null;
    var o; try { o = JSON.parse(texto); } catch (e) { return null; }
    if (!o || o.v !== 1 || o.tipo !== 'contacto' || typeof o.s !== 'string' || typeof o.k !== 'string' || typeof o.t !== 'string') return null;
    return o;
  }

  var datos = location.hash.slice(1);
  var q = datos ? leer(datos) : null;
  if (!q) { $('invalida').hidden = false; return; }

  var android = /Android/i.test(navigator.userAgent);
  var sinApp = /(^|[?&])sinapp=1(&|$)/.test(location.search);
  var nombre = typeof q.n === 'string' && q.n.length >= 1 && q.n.length <= 40 ? q.n : null;
  $('titulo').textContent = nombre ? 'Te ha invitado ' + nombre + ' a seguirle' : 'Te han invitado a seguir a un ciclista';
  $('valida').hidden = false;

  // La app: se descarga de GitHub (siempre disponible) salvo que la pagina sea la del servidor, que la tiene en /descargas
  $('b-descargar').href = enPaginas ? APK_GITHUB : '/descargas/CascoSOS-debug.apk';

  // «Abrir en la app»: el intent de Chrome abre la app si esta instalada y, si no, vuelve a esta misma pagina avisando de que falta
  var vuelta = location.origin + location.pathname + '?sinapp=1#' + datos;
  var intent = 'intent://unirse/' + datos + '#Intent;scheme=cascosos;package=es.uah.cascosos;S.browser_fallback_url=' + encodeURIComponent(vuelta) + ';end';
  $('b-abrir').href = android ? intent : '#';

  // Seguir desde el navegador: el visor vive en el servidor del ciclista, y solo es alcanzable desde fuera por el tunel (w = 1)
  var puerto = q.pp && q.pp !== 443 ? ':' + q.pp : '';
  var visor = enPaginas ? 'https://' + q.s + puerto + '/ver/#unirse=' + datos : '/ver/#unirse=' + datos;
  if (enPaginas && q.w !== 1) $('b-visor').hidden = true; else $('b-visor').href = visor;

  if (!android) {                      // la app es solo Android: en iPhone u ordenador, el visor del navegador
    $('b-abrir').hidden = true; $('b-descargar').hidden = true; $('solo-android').hidden = false;
  } else if (sinApp) {
    $('sinapp').hidden = false; $('ayuda-instalar').hidden = false;
    $('b-descargar').className = 'boton'; $('b-abrir').className = 'boton sec';
    $('valida').insertBefore($('b-descargar'), $('b-abrir'));
  }
  document.body.dataset.listo = '1';
})();
