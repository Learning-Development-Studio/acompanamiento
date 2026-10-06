import sys,os,json,subprocess,termios
from pathlib import Path
root=Path(__file__).resolve().parent.parent
if sys.stdin.isatty():
 settings=termios.tcgetattr(sys.stdin)
 settings[3]&=~termios.ECHO
 termios.tcsetattr(sys.stdin,termios.TCSANOW,settings)
print('Ready for source credential JSON on stdin (input is hidden).',flush=True)
value=json.loads(sys.stdin.readline())
credential=value['credential']
project_id=value['project_id']
if json.loads((root/'.openai/hosting.json').read_text())['project_id']!=project_id:
 raise SystemExit('El proyecto del manifiesto no coincide.')
token=credential['token']
if credential['auth_mode']!='http_extra_header':
 raise SystemExit('Modo de autenticación no soportado por este entorno.')
header=token if token.startswith('Authorization:') else 'Authorization: '+(token if token.startswith('Bearer ') else 'Bearer '+token)
environment=dict(os.environ,GIT_TERMINAL_PROMPT='0',GIT_CONFIG_COUNT='1',GIT_CONFIG_KEY_0='http.extraHeader',GIT_CONFIG_VALUE_0=header)
def run(args):
 result=subprocess.run(args,cwd=root,env=environment,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if result.returncode:
  safe=(result.stderr or result.stdout).replace(token,'[credential hidden]').replace(header,'[header hidden]')
  raise RuntimeError(safe[:2500])
 return result.stdout.strip()
if not (root/'.git').exists():
 run(['git','init','-b',credential['branch']])
 run(['git','config','user.name','Codex'])
 run(['git','config','user.email','codex@users.noreply.github.com'])
 run(['git','remote','add','sites',credential['remote_url']])
 run(['git','ls-remote','sites'])
run(['git','add','.'])
if run(['git','status','--porcelain']):
 run(['git','commit','-m',value.get('message','Crear seguimiento familiar con guardado compartido y perfiles')])
sha=run(['git','rev-parse','HEAD'])
run(['git','push','sites','HEAD:refs/heads/'+credential['branch']])
print(json.dumps({'project_id':project_id,'commit_sha':sha,'source_pushed':True}),flush=True)
