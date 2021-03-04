import os
import pkg_resources
try:
    from urllib2 import urlopen, URLError, Request
except ImportError:
    from urllib.request import urlopen, URLError, Request
from .obo import OBOParser
from . import unimod


def _use_vendored_psims_obo():
    return pkg_resources.resource_stream(__name__, "vendor/psi-ms.obo")


def _use_vendored_psimod_obo():
    return pkg_resources.resource_stream(__name__, "vendor/psi-mod.obo")


def _use_vendored_unit_obo():
    return pkg_resources.resource_stream(__name__, "vendor/unit.obo")


def _use_vendored_pato_obo():
    return pkg_resources.resource_stream(__name__, "vendor/pato.obo")


def _use_vendored_unimod_xml():
    return pkg_resources.resource_stream(__name__, "vendor/unimod_tables.xml")


def _use_vendored_xlmod_obo():
    return pkg_resources.resource_stream(__name__, "vendor/XLMOD.obo")


def _use_vendored_bto_obo():
    return pkg_resources.resource_stream(__name__, "vendor/bto.obo")


def _use_vendored_go_obo():
    return pkg_resources.resource_stream(__name__, "vendor/go.obo")


def _use_vendored_gno_obo():
    return pkg_resources.resource_stream(__name__, "vendor/gno.obo")


fallback = {
    ("http://psidev.cvs.sourceforge.net/*checkout*/"
     "psidev/psi/psi-ms/mzML/controlledVocabulary/psi-ms.obo"): _use_vendored_psims_obo,
    ("http://psidev.cvs.sourceforge.net/viewvc/*checkout*/"
     "psidev/psi/psi-ms/mzML/controlledVocabulary/psi-ms.obo"): _use_vendored_psims_obo,
    ("https://raw.githubusercontent.com/HUPO-PSI/psi-ms-CV/master/psi-ms.obo"): _use_vendored_psims_obo,
    ("http://obo.cvs.sourceforge.net/*checkout*/"
     "obo/obo/ontology/phenotype/unit.obo"): _use_vendored_unit_obo,
    ("http://ontologies.berkeleybop.org/uo.obo"): _use_vendored_unit_obo,
    ("http://ontologies.berkeleybop.org/pato.obo"): _use_vendored_pato_obo,
    ("https://raw.githubusercontent.com/HUPO-PSI/mzIdentML/master/cv/XLMOD.obo"): _use_vendored_xlmod_obo,
    ("http://www.brenda-enzymes.info/ontology/tissue/tree/update/update_files/BrendaTissueOBO"
     ): _use_vendored_bto_obo,
    "http://purl.obolibrary.org/obo/go.obo": _use_vendored_go_obo,
    "https://raw.githubusercontent.com/HUPO-PSI/psi-mod-CV/master/PSI-MOD.obo": _use_vendored_psimod_obo,
    "http://purl.obolibrary.org/obo/gno.obo": _use_vendored_gno_obo,
}


class ControlledVocabulary(object):
    """A Controlled Vocabulary is a collection
    of terms or entities with controlled meanings
    and semantics.

    This object makes entities resolvable by name,
    accession number, or synonym.

    Attributes
    ----------
    id : str
        Unique identifier for this collection
    """
    @classmethod
    def from_obo(cls, handle):
        parser = OBOParser(handle)
        inst = cls(parser.terms, metadata=parser.header, version=parser.version, name=parser.name)
        if len(parser.terms) == 0:
            raise ValueError("Empty Vocabulary")
        return inst

    def __init__(self, terms, id=None, metadata=None, version=None, name=None):
        if metadata is None:
            metadata = dict()
        if version is None:
            version = 'unknown'
        self.version = version
        self.name = name
        self._terms = dict()
        self.terms = terms
        self.id = id
        self.metadata = metadata

    def __getitem__(self, key):
        return self.query(key)

    def query(self, key):
        if key in self.terms:
            return self.terms[key]
        elif key in self._names:
            return self._names[key]
        else:
            normalized_key = self.normalize_name(key)
            if normalized_key in self._names:
                return self._names[normalized_key]
            lower_key = key.lower()
            if lower_key in self._synonyms:
                return self._synonyms[lower_key]
            elif lower_key in self.terms:
                return self.terms[lower_key]
            elif lower_key in self._obsolete_names:
                return self._obsolete_names[lower_key]
            else:
                raise KeyError("%s and %s were not found." % (key, normalized_key))

    def __repr__(self):
        template = ("{self.__class__.__name__}(terms={size}, id={self.id}, "
                    "name={self.name}, version={self.version})")
        return template.format(self=self, size=len(self.terms))

    def __iter__(self):
        return iter(self.terms)

    @property
    def terms(self):
        return self._terms

    @terms.setter
    def terms(self, value):
        self._terms = dict(value or {})
        self._reindex()

    def _reindex(self):
        self._bind_terms()
        self._build_names()
        self._build_case_normalized()
        self._build_synonyms()

    def _build_names(self):
        self._names = {
            v['name']: v for v in self.terms.values()
            if not v.get("is_obsolete", False)
        }
        self._obsolete_names = {
            v['name'].lower(): v for v in self.terms.values()
            if v.get("is_obsolete", False)
        }

    def _bind_terms(self):
        for term in self.terms.values():
            term.vocabulary = self

    def _build_synonyms(self):
        self._synonyms = {}
        for term in self.terms.values():
            if term.get('synonym'):
                for synonym in term.get('synonym'):
                    self._synonyms[synonym.lower()] = term

    def _build_case_normalized(self):
        self._normalized = {
            v['name'].lower(): v['name']
            for v in self.terms.values()
        }

    def keys(self):
        return self.terms.keys()

    def names(self):
        return self._names.keys()

    def items(self):
        return self.terms.items()

    def normalize_name(self, name):
        return self._normalized[name.lower()]


DEFAULT_USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like'
    ' Gecko) Chrome/68.0.3440.106 Safari/537.36')


class OBOCache(object):
    """A cache for retrieved ontology sources

    Attributes
    ----------
    cache_exists : bool
        Whether the cache directory exists
    cache_path : str
        The path to the cache directory
    enabled : bool
        Whether the cache will be used or not
    resolvers : dict
        A mapping from ontology URL to a function
        which will be called instead of opening the
        URL to retrieve the :class:`ControlledVocabulary`
        object.
    """

    def __init__(self, cache_path='.obo_cache', enabled=True, resolvers=None, user_agent_emulation=True):
        self._cache_path = None
        self.cache_path = cache_path
        self.enabled = enabled
        self.resolvers = resolvers or {}
        self.user_agent_emulation = user_agent_emulation

    @property
    def cache_path(self):
        return self._cache_path

    @cache_path.setter
    def cache_path(self, value):
        self._cache_path = value
        self.cache_exists = os.path.exists(self.cache_path)

    def path_for(self, name, setext=True):
        if not self.cache_exists:
            os.makedirs(self.cache_path)
            self.cache_exists = True
        name = os.path.basename(name)
        if not name.endswith(".obo") and setext:
            name += '.obo'
        return os.path.join(self.cache_path, name)

    def _open_url(self, uri):
        try:
            headers = {}
            if self.user_agent_emulation:
                headers['User-Agent'] = DEFAULT_USER_AGENT
            req = Request(uri, headers=headers)
            f = urlopen(req)
            code = None
            # The keepalive library monkey patches urllib2's urlopen and returns
            # an object with a different API. First handle the normal case, then
            # the patched case.
            if hasattr(f, 'getcode'):
                code = f.getcode()
            elif hasattr(f, "code"):
                code = f.code
            else:
                raise ValueError("Can't understand how to get HTTP response code from %r" % f)
            if code != 200:
                raise ValueError("%s did not resolve" % uri)
        except Exception:
            if uri in fallback:
                f = fallback[uri]()
            else:
                raise ValueError(uri)
        return f

    def fallback(self, uri):
        if uri in fallback:
            f = fallback[uri]()
        else:
            f = None
        return f

    def has_custom_resolver(self, uri):
        return uri in self.resolvers

    def resolve(self, uri):
        if uri in self.resolvers:
            return self.resolvers[uri](self)
        try:
            if self.enabled:
                name = self.path_for(uri)
                if os.path.exists(name) and os.path.getsize(name) > 0:
                    return open(name, 'rb')
                else:
                    f = self._open_url(uri)
                    with open(name, 'wb') as cache_f:
                        n_chars = 0
                        for i, line in enumerate(f.readlines()):
                            n_chars += len(line)
                            cache_f.write(line)
                        if n_chars < 5:
                            raise ValueError("No bytes written")
                    if os.path.getsize(name) > 0:
                        return open(name, 'rb')
                    else:
                        raise ValueError("Failed to download .obo")
            else:
                f = self._open_url(uri)
                return f
        except ValueError:
            import traceback
            traceback.print_exc()
            raise

    def set_resolver(self, uri, provider):
        self.resolvers[uri] = provider

    def __repr__(self):
        return "OBOCache(cache_path=%r, enabled=%r, resolvers=%s)" % (
            self.cache_path, self.enabled, self.resolvers)


def _make_relative_sqlite_sqlalchemy_uri(path):
    return "sqlite:///%s" % path


def resolve_unimod(cache):
    if cache.enabled:
        path = _make_relative_sqlite_sqlalchemy_uri(
            cache.path_for("unimod.db", False))
        try:
            return unimod.Unimod(path)
        except IOError:
            return unimod.Unimod(path, _use_vendored_unimod_xml())
    else:
        try:
            return unimod.Unimod()
        except IOError:
            return unimod.Unimod(None, _use_vendored_unimod_xml())


obo_cache = OBOCache(enabled=False)
obo_cache.set_resolver("http://www.unimod.org/obo/unimod.obo", resolve_unimod)


def configure_obo_store(path):
    if path is None:
        obo_cache.enabled = False
    else:
        obo_cache.cache_path = path
        obo_cache.enabled = True


def register_resolver(name, fn):
    obo_cache.set_resolver(name, fn)


def load_psims():
    try:
        cv = obo_cache.resolve(("https://raw.githubusercontent.com/HUPO-PSI/psi-ms-CV/master/psi-ms.obo"))
        return ControlledVocabulary.from_obo(cv)
    except TypeError:
        cv = _use_vendored_psims_obo()
        return ControlledVocabulary.from_obo(cv)


def load_uo():
    cv = obo_cache.resolve("http://ontologies.berkeleybop.org/uo.obo")
    return ControlledVocabulary.from_obo(cv)


def load_pato():
    cv = obo_cache.resolve("http://ontologies.berkeleybop.org/pato.obo")
    return ControlledVocabulary.from_obo(cv)


def load_xlmod():
    cv = obo_cache.resolve("https://raw.githubusercontent.com/HUPO-PSI/mzIdentML/master/cv/XLMOD.obo")
    return ControlledVocabulary.from_obo(cv)


def load_unimod():
    return obo_cache.resolve("http://www.unimod.org/obo/unimod.obo")


def load_bto():
    cv = obo_cache.resolve("http://www.brenda-enzymes.info/ontology/tissue/tree/update/update_files/BrendaTissueOBO")
    return ControlledVocabulary.from_obo(cv)


def load_go():
    cv = obo_cache.resolve("http://purl.obolibrary.org/obo/go.obo")
    return ControlledVocabulary.from_obo(cv)


def load_psimod():
    cv = obo_cache.resolve("https://raw.githubusercontent.com/HUPO-PSI/psi-mod-CV/master/PSI-MOD.obo")
    return ControlledVocabulary.from_obo(cv)


def load_gno():
    cv = obo_cache.resolve("http://purl.obolibrary.org/obo/gno.obo")
    return ControlledVocabulary.from_obo(cv)
